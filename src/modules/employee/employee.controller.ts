import { Body, Controller, Delete, Get, Param, Post, UseGuards, UseInterceptors, UploadedFile } from "@nestjs/common";
import { EmployeeService } from "./employee.service";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import { JwtAuthGuard } from "src/utils/guards/jwt-auth.guard";
import { CurrentUser } from "src/utils/decorators/get-user.decorator";
import { FileInterceptor } from '@nestjs/platform-express';
import { profileConfig } from 'src/utils/config/multer.config'; // Import the Multer configuration

@Controller('employee')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) { }

    @Post()
    @UseInterceptors(FileInterceptor('img', { storage: profileConfig }))
    async create(
        @UploadedFile() img: any,
        @Body() body: any
    ): Promise<APIResponseInterface<any>> {
        return await this.employeeService.createEmployee(body, img);
    }

    @Post('bulk-upload')
    async bulkCreate(
        @Body() body: any
    ): Promise<APIResponseInterface<any>> {
        return await this.employeeService.bulkCreate(body);
    }

    @Post('inactive-user')
    async inactiveUser(
        @Body() body: any
    ): Promise<APIResponseInterface<any>> {
        return await this.employeeService.inactiveUser(body);
    }

    @Post('list')
    async findAll(@Body() employeePayload: any): Promise<APIResponseInterface<any>> {
        return await this.employeeService.getAllEmployee(employeePayload);
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

    @Post('update')
    @UseInterceptors(FileInterceptor('img', { storage: profileConfig }))
    async updateEmployee(
        @Body() body: any,
        @UploadedFile() img: any,
    ): Promise<APIResponseInterface<any>> {
        return await this.employeeService.updateEmployee(body, img);
    }

}