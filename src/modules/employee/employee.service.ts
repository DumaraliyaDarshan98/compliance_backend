import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Employee, EmployeeDocument } from "./schema/employee.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import * as bcrypt from 'bcrypt';
@Injectable()
export class EmployeeService {
    constructor(@InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>) { }

    async createEmployee(employeeDto: any): Promise<APIResponseInterface<any>> {
        const { password, ...rest } = employeeDto;

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const employee = new this.employeeModel({ ...rest, password: hashedPassword });

        const data = employee.save();
        return {
            data
        }
    }

    async getAllEmployee(): Promise<APIResponseInterface<any>> {
        const employeeList = await this.employeeModel.find().exec();
        return {
            data: employeeList
        }
    }

    async findById(id: string): Promise<APIResponseInterface<Employee>> {
        const employee = await this.employeeModel.findById(id).exec();
        if (!employee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }
        return { data: employee };
    }

    async deleteById(id: string): Promise<APIResponseInterface<any>> {
        const result = await this.employeeModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }
        return { message: `Employee with ID ${id} deleted successfully` };
    }

    async findByEmail(email: string): Promise<Employee> {
        const employee = await this.employeeModel.findOne({ email }).exec();
        if (!employee) {
            throw new NotFoundException(`Employee with email ${email} not found`);
        }
        return employee;
    }
}