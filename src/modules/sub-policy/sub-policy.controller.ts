import { SubPolicyService } from './sub-policy.service';
import { Body, Controller, Delete, Get, Param, Post, UseGuards, BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "src/utils/guards/jwt-auth.guard";
import { APIResponseInterface } from 'src/utils/interfaces/response.interface';
import { ObjectId } from 'mongodb';

@Controller('sub-policy')
@UseGuards(JwtAuthGuard)
export class SubPolicyController {
    constructor(
        private readonly subPolicyService: SubPolicyService
    ) { }

    @Post('/list')
    async getAllSubPolicy(@Body() subPolicyPayload: any): Promise<APIResponseInterface<any>> {
        return await this.subPolicyService.getAllSubPolicy(subPolicyPayload);
    }

    @Post()
    async createSubPolicy(@Body() subPolicyPayload: any): Promise<APIResponseInterface<any>> {
        return await this.subPolicyService.createSubPolicy(subPolicyPayload);
    }

    @Post('update/:id')
    async updateSubPolicy(@Param('id') id: string , @Body() subPolicyPayload: any): Promise<APIResponseInterface<any>> {
        return await this.subPolicyService.updateSubPolicy(id, subPolicyPayload);
    }

    @Post('/delete')
    async deleteById(@Body() subPolicyPayload: any) {
        return this.subPolicyService.deleteById(subPolicyPayload);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/detail')
    async findById(@Body() subPolicyPayload: any) {
        return this.subPolicyService.findById(subPolicyPayload);
    }
}