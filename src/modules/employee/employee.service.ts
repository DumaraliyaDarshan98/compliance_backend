import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Employee, EmployeeDocument } from "./schema/employee.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import * as bcrypt from 'bcrypt';
import { MailerService } from "src/utils/mailer/mailer.service";
@Injectable()
export class EmployeeService {
    constructor(
        @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
        private readonly mailService: MailerService
    ) { }

    async createEmployee(employeeDto: any): Promise<APIResponseInterface<any>> {
        const { password, ...rest } = employeeDto;

        if (!employeeDto?.email) {
            throw new BadRequestException(`Please enter your email address`);
        }

        const existingDetails = await this.employeeModel.findOne({ email: employeeDto?.email }).exec();
        if (existingDetails) {
            throw new BadRequestException(`Email Already Exists`);
        }

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const employee = new this.employeeModel({ ...rest, password: hashedPassword });

        try {
            const data = await employee.save();

            // Mail send to user
            const resetUrl = `http://localhost:4200/reset?token=${data.email}`;
            const emailContent: any = `<p>Click <a href="${resetUrl}">here</a> to set your new password.</p>`;
            await this.mailService.sendResetPasswordEmail(data.email, emailContent);

            return { data };
        } catch (error) {
            console.error("Error saving employee:", error);
            throw new InternalServerErrorException("Failed to create employee");
        }
    }

    async getAllEmployee(): Promise<APIResponseInterface<any>> {
        try {
            const employeeList = await this.employeeModel.find().exec();
            return {
                data: employeeList
            }
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

            console.log("Employee", employee)
            if (!employee) {
                throw new NotFoundException(`Employee with email ${email} not found`);
            }
            return employee;
        } catch (error) {
            console.error("Error findByEmail:", error);
            throw new InternalServerErrorException("Failed to findByEmail");
        }
    }
}