import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, HttpStatus } from "@nestjs/common";
import { Employee, EmployeeDocument } from "./schema/employee.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import { MailerService } from "src/utils/mailer/mailer.service";
import { CONFIG } from "src/utils/keys/keys";

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    private readonly mailService: MailerService
  ) { }

  async createEmployee(body: any, img?: any): Promise<APIResponseInterface<any>> {
    const employeeDto = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
    const { password, profileImg, ...rest } = employeeDto;
    console.log("employeeDto", employeeDto);
    if (!employeeDto?.email) {
      throw new BadRequestException(`Please enter email address`);
    }

    if (!employeeDto?.employeeIdentity) {
      throw new BadRequestException(`Please enter employee Id`);
    }

    const existingEmployeeId = await this.employeeModel.findOne({ employeeIdentity: employeeDto?.employeeIdentity }).exec();
    if (existingEmployeeId) {
      throw new BadRequestException(`Employee Id Already Exists`);
    }

    const existingDetails = await this.employeeModel.findOne({ email: employeeDto?.email }).exec();
    if (existingDetails) {
      throw new BadRequestException(`Email Already Exists`);
    }

    const existingPhoneDetails = await this.employeeModel.findOne({ phone: employeeDto?.phone }).exec();
    if (existingPhoneDetails) {
      throw new BadRequestException(`Phone number Already Exists`);
    }

    const existingPhoneAltDetails = await this.employeeModel.findOne({ alternatePhone: employeeDto?.phone }).exec();
    if (existingPhoneAltDetails) {
      throw new BadRequestException(`Phone number Already Exists`);
    }

    if (employeeDto?.alternatePhone) {
      const existingAlPhoneDetails = await this.employeeModel.findOne({ alternatePhone: employeeDto?.alternatePhone }).exec();
      if (existingAlPhoneDetails) {
        throw new BadRequestException(`Alternate Phone number Already Exists`);
      }
    }

    if (employeeDto?.alternatePhone) {
      const existingAlPhoneNumberDetails = await this.employeeModel.findOne({ phone: employeeDto?.alternatePhone }).exec();
      if (existingAlPhoneNumberDetails) {
        throw new BadRequestException(`Alternate Phone number Already Exists`);
      }
    }

    const payload = { ...rest }
    if (img) {
      payload['profileImg'] = '/uploads/profile/' + img.filename
    }
    const employee = new this.employeeModel(payload);

    try {
      const data = await employee.save();

      const loginUrl = `${CONFIG.frontURL}login`;
      // const emailContent = `<p>Click <a href="${resetUrl}">here</a> to set your new password.</p>`;
      const emailContent = `<!DOCTYPE html>
      <html>
      <head>
          <title>Account Registration Successful</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  width: 100%;
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  padding: 20px;
                  border-radius: 5px;
                  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
              }
              .header-text {
                  font-size: 24px;
                  font-weight: bold;
                  color: #333333;
                  margin-bottom: 20px;
                  text-align: left;
              }
              .content {
                  font-size: 16px;
                  color: #333333;
                  text-align: left;
              }
              .button {
                  display: inline-block;
                  margin-top: 20px;
                  padding: 12px 24px;
                  background-color: #007BFF;
                  color: white !important;
                  text-decoration: none;
                  font-size: 16px;
                  border-radius: 5px;
              }
              .footer {
                  margin-top: 20px;
                  font-size: 12px;
                  color: #777777;
                  text-align: left;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header-text">Registration Successful</div>
              <div class="content">
                  <p>Hello,</p>
                  <p>Congratulations! Your account has been successfully registered on the Compliance Portal.</p>
                  <p>You can now login and start your test using the button below:</p>
                  <div>
                      <a href="${loginUrl}" class="button">Login to Compliance Portal</a>
                  </div>
                  <p>Thanks, <br> Compliance Team</p>
              </div>
              <p class="footer">
                  If you have any questions, please contact our support team.
              </p>
          </div>
      </body>
      </html>
      `;
      await this.mailService.sendResetPasswordEmail(employee.email, emailContent, 'Welcome to Compliance Portal – Your Account is Ready!');

      return { data };
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException("Failed to create employee");
    }
  }

  async inactiveUser(employeeDto: any): Promise<APIResponseInterface<any>> {
    try {
      const { id, reason } = employeeDto;

      if (!id) {
        throw new BadRequestException(`Employee id required !`);
      }

      if (!reason) {
        throw new BadRequestException(`Please enter reason for inactive !`);
      }

      const employee = await this.employeeModel.findById(id).exec();

      employee['inactiveReason'] = reason || "";
      employee['isActive'] = 0;
      employee['inactiveDate'] = new Date();

      const data = await employee.save();

      return { data }
    } catch (error) {
      console.log('error', error);
      throw new InternalServerErrorException("Failed to inactive");
    }
  }

  async bulkCreate(employeeDtos: any[]): Promise<APIResponseInterface<any>> {
    if (!Array.isArray(employeeDtos) || employeeDtos.length === 0) {
      throw new BadRequestException(`Invalid request. Please provide employee data.`);
    }

    const employeeIdList = employeeDtos.map(emp => emp.employeeIdentity);

    const existingEmpIds = await this.employeeModel.find({ employeeIdentity: { $in: employeeIdList } }).exec();
    const existingEmpIdList = new Set(existingEmpIds.map(emp => emp.employeeIdentity));

    const emails = employeeDtos.map(emp => emp.email);

    const existingEmployees = await this.employeeModel.find({ email: { $in: emails } }).exec();
    const existingEmails = new Set(existingEmployees.map(emp => emp.email));

    const phones = employeeDtos.map(emp => emp.phone);

    const existingPhoneEmployees = await this.employeeModel.find({ phone: { $in: phones } }).exec();
    const existingPhones = new Set(existingPhoneEmployees.map(emp => emp.phone));

    const newEmployees = employeeDtos
      .filter(emp => !existingEmails.has(emp.email) && !existingPhones.has(emp.phone) && !existingEmpIdList.has(emp.employeeIdentity))
      .map(({ password, isSendMail, ...rest }) => new this.employeeModel(rest));

    if (newEmployees.length === 0) {
      throw new BadRequestException(`All provided emails already exist.`);
    }

    for (const employee of newEmployees) {
      employee['dateOfJoining'] = employee?.dateOfJoining ? new Date(employee.dateOfJoining) : new Date();
      employee['birthDate'] = employee?.birthDate ? new Date(employee.birthDate) : new Date();
      employee['isSendMail'] = 0;
    }

    try {
      const createdEmployees = await this.employeeModel.insertMany(newEmployees);

      return { data: createdEmployees };
    } catch (error) {
      throw new InternalServerErrorException("Failed to create employees");
    }
  }

  async getAllEmployee(payload: any): Promise<APIResponseInterface<any>> {
    try {
      let query = {};

      if (payload.searchText && payload.searchText.trim() !== "") {
        query = {
          $or: [
            { email: { $regex: payload.searchText, $options: 'i' } },
            { firstName: { $regex: payload.searchText, $options: 'i' } },
            { lastName: { $regex: payload.searchText, $options: 'i' } }
          ]
        };
      }

      let sortOptions = {};
      if (payload.sortBy && payload.sortOrder) {
        sortOptions[payload.sortBy] = payload.sortOrder === "asc" ? 1 : -1;
      } else {
        sortOptions['_id'] = -1;
      }

      const pageNumber = payload.pageNumber || 1;
      const pageLimit = payload.pageLimit || 10;
      const pageOffset = (pageNumber - 1) * pageLimit;

      const totalCount = await this.employeeModel.countDocuments(query).exec();

      const employeeList = await this.employeeModel.find(query)
        .sort(sortOptions)
        .skip(pageOffset)
        .limit(pageLimit)
        .exec();

      if (employeeList.length <= 0) {
        return {
          code: HttpStatus.OK,
          message: "Employee list not found."
        }
      }

      return {
        data: {
          employeeList: employeeList,
          count: totalCount,
          pageNumber: pageNumber,
          pageLimit: pageLimit
        }
      };
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

  async updateEmployee(body: any, img?: any): Promise<APIResponseInterface<any>> {
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

    if (img) {
      employeeDto.profileImg = '/uploads/profile/' + img.filename;
    }

    Object.assign(existingEmployee, rest, { profileImg: employeeDto.profileImg });

    try {
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
