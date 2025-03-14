import { PolicyDueDateService } from './policy-due-date.service';
import { Body, Controller, Delete, Get, Param, Post, UseGuards, BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "src/utils/guards/jwt-auth.guard";
import { APIResponseInterface } from 'src/utils/interfaces/response.interface';
import { ObjectId } from 'mongodb';

@Controller('policy-due-date')
@UseGuards(JwtAuthGuard)
export class PolicyDueDateController {
    constructor(
        private readonly policyDueDateService: PolicyDueDateService
    ) { }

    @Post('/upsert')
    async upsertPolicyDueDate(@Body() policyDueDatePayload: any): Promise<APIResponseInterface<any>> {
        return await this.policyDueDateService.upsertPolicyDueDate(policyDueDatePayload);
    }

}