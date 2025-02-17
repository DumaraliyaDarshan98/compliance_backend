import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EmployeeService } from './employee.service';

@Controller('employee')
export class EmployeeController {
    constructor(private readonly usersService: EmployeeService) { }

    @Post()
    async create(@Body() userData: any): Promise<any> {
        return await this.usersService.create(userData);
    }

    @Get()
    async findAll(): Promise<any[]> {
        return await this.usersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<any> {
        return await this.usersService.findOne(id);
    }
}
