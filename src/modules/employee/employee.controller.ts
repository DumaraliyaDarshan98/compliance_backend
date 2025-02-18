import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { EmployeeService } from "./employee.service";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import { JwtAuthGuard } from "src/utils/guards/jwt-auth.guard";
import { CurrentUser } from "src/utils/decorators/get-user.decorator";

@Controller('employee')
@UseGuards(JwtAuthGuard)
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

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.employeeService.findById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteById(@Param('id') id: string) {
        return this.employeeService.deleteById(id);
    }
}