import { Injectable, NotFoundException } from "@nestjs/common";
import { Employee, EmployeeDocument } from "./schema/employee.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";

@Injectable()
export class EmployeeService {
    constructor(@InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>) { }

    async createEmployee(employeeDto: any): Promise<APIResponseInterface<any>> {
        const employee = new this.employeeModel(employeeDto);
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
}