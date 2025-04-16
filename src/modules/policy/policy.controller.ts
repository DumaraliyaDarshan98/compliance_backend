import { PolicyService } from './policy.service';
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/utils/guards/jwt-auth.guard";
import { APIResponseInterface } from 'src/utils/interfaces/response.interface';

@Controller('policy')
@UseGuards(JwtAuthGuard)
export class PolicyController {
    constructor(
        private readonly policyService: PolicyService
    ) { }

    @Post('list')
    async getAllPolicy(@Body() policyPayload: any): Promise<APIResponseInterface<any>> {
        return await this.policyService.getAllPolicy(policyPayload);
    }

    @Post()
    async createPolicy(@Body() policyPayload: any): Promise<APIResponseInterface<any>> {
        return await this.policyService.createPolicy(policyPayload);
    }

    @Post('update/:id')
    async updatePolicy(@Param('id') id: string, @Body() policyPayload: any): Promise<APIResponseInterface<any>> {
        return await this.policyService.updatePolicy(id, policyPayload);
    }

    @Delete(':id')
    async deleteById(@Param('id') id: string) {
        return this.policyService.deleteById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.policyService.findById(id);
    }
}