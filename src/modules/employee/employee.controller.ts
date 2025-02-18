import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { EmployeeService } from "./employee.service";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";

@Controller('employee')
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) { }

    @Post()
    async create(@Body() employeeDto: any): Promise<APIResponseInterface<any>> {
        return await this.employeeService.createEmployee(employeeDto);
    }

    @Get()
    async findAll(): Promise<APIResponseInterface<any>> {
        return await this.employeeService.getAllEmployee();
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.employeeService.findById(id);
    }

    @Delete(':id')
    async deleteById(@Param('id') id: string) {
        return this.employeeService.deleteById(id);
    }
}