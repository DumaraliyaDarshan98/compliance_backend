import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from "@nestjs/common";
import { Employee, EmployeeDocument } from "./schema/employee.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import * as bcrypt from 'bcrypt';
import { MailerService } from "src/utils/mailer/mailer.service";
import { CONFIG } from "src/utils/keys/keys";
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    private readonly mailService: MailerService
  ) {}

  async createEmployee(img: Express.Multer.File, body: any): Promise<APIResponseInterface<any>> {
    const employeeDto = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
    const { password, profileImg, ...rest } = employeeDto;

    if (!employeeDto?.email) {
      throw new BadRequestException(`Please enter your email address`);
    }

    const existingDetails = await this.employeeModel.findOne({ email: employeeDto?.email }).exec();
    if (existingDetails) {
      throw new BadRequestException(`Email Already Exists`);
    }

    // Hash password before saving
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    const employee = new this.employeeModel({ ...rest, profileImg: '/uploads/profile/' + img.filename });

    try {
      const data = await employee.save();

      // Mail send to user
      // const resetUrl = `${CONFIG.frontURL}create-password?token=${data.email}`;
      // const emailContent: any = `<p>Click <a href="${resetUrl}">here</a> to set your new password.</p>`;
      // await this.mailService.sendResetPasswordEmail(data.email, emailContent, 'Set Your Password');

      return { data };
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException("Failed to create employee");
    }
  }

  async bulkCreate(employeeDtos: any[]): Promise<APIResponseInterface<any>> {
    if (!Array.isArray(employeeDtos) || employeeDtos.length === 0) {
      throw new BadRequestException(`Invalid request. Please provide employee data.`);
    }

    // Extract emails from payload
    const emails = employeeDtos.map(emp => emp.email);

    // Check for existing employees with the given emails
    const existingEmployees = await this.employeeModel.find({ email: { $in: emails } }).exec();
    const existingEmails = new Set(existingEmployees.map(emp => emp.email));

    // Filter out employees that already exist
    const newEmployees = employeeDtos
      .filter(emp => !existingEmails.has(emp.email))
      .map(({ password, ...rest }) => new this.employeeModel(rest));

    if (newEmployees.length === 0) {
      throw new BadRequestException(`All provided emails already exist.`);
    }

    for (const employee of newEmployees) {
      employee['dateOfJoining'] = employee?.dateOfJoining ? new Date(employee.dateOfJoining) : new Date();
      employee['birthDate'] = employee?.birthDate ? new Date(employee.birthDate) : new Date();
    }

    try {
      // Bulk insert new employees
      const createdEmployees = await this.employeeModel.insertMany(newEmployees);

      // Send password reset email to newly created employees
      for (const employee of createdEmployees) {
        const resetUrl = `${CONFIG.frontURL}create-password?token=${employee.email}`;
        const emailContent = `<p>Click <a href="${resetUrl}">here</a> to set your new password.</p>`;
        await this.mailService.sendResetPasswordEmail(employee.email, emailContent, 'Set Your Password');
      }

      return { data: createdEmployees };
    } catch (error) {
      throw new InternalServerErrorException("Failed to create employees");
    }
  }

  async getAllEmployee(): Promise<APIResponseInterface<any>> {
    try {
      const employeeList = await this.employeeModel.find().exec();
      return { data: employeeList };
    } catch (error) {
      console.error("Error getAllEmployee:", error);
      throw new InternalServerErrorException("Failed to getAllEmployee");
    }
  }

  async findById(id: string): Promise<APIResponseInterface<Employee>> {
    try {
      const employee = await this.employeeModel.findById(id).exec();
      if (!employee) {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }
      return { data: employee };
    } catch (error) {
      console.error("Error findById:", error);
      throw new InternalServerErrorException("Failed to findById");
    }
  }

  async deleteById(id: string): Promise<APIResponseInterface<any>> {
    try {
      const result = await this.employeeModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }
      return { message: `Employee with ID ${id} deleted successfully` };
    } catch (error) {
      console.error("Error deleteById:", error);
      throw new InternalServerErrorException("Failed to deleteById");
    }
  }

  async findByEmail(email: string): Promise<Employee> {
    try {
      const employee = await this.employeeModel.findOne({ email });

      if (!employee) {
        throw new NotFoundException(`Employee with email ${email} not found`);
      }
      return employee;
    } catch (error) {
      console.error("Error findByEmail:", error);
      throw new InternalServerErrorException("Failed to findByEmail");
    }
  }

  async updateEmployee(
    body: any,
    img?: Express.Multer.File
  ): Promise<APIResponseInterface<any>> {
    const employeeDto = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
    const { password, profileImg, ...rest } = employeeDto;

    const existingEmployee = await this.employeeModel.findById(employeeDto.id);

    if (!existingEmployee) {
      throw new NotFoundException(`Employee with ID ${employeeDto.id} not found`);
    }

    const emailExists = await this.employeeModel.findOne({
      email: employeeDto.email,
      _id: { $ne: employeeDto.id },
    });

    if (emailExists) {
      throw new BadRequestException(`Email address ${employeeDto.email} is already in use by another employee`);
    }

    if (password) {
      // Uncomment and use bcrypt logic to hash the new password if required
      // const salt = await bcrypt.genSalt(10);
      // employeeDto.password = await bcrypt.hash(password, salt);
    }

    // If a new profile image is uploaded, set the profileImg field
    if (img) {
      // if (fs.existsSync(oldImagePath)) {
      //     fs.unlinkSync(oldImagePath);
      // }

      employeeDto.profileImg = '/uploads/profile/' + img.filename;
    }

    // Update the employee's data (excluding password if not provided)
    Object.assign(existingEmployee, rest, { profileImg: employeeDto.profileImg });

    try {
      // Save the updated employee data
      const updatedEmployee = await existingEmployee.save();

      return {
        status: 200,
        message: 'Employee updated successfully',
        data: updatedEmployee,
      } as APIResponseInterface<any>;
    } catch (error) {
      console.log('Error during employee update:', error);
      throw new InternalServerErrorException('Failed to update employee');
    }
  }
}
