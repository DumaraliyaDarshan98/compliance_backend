import { PolicySettingService } from './policy-setting.service';
import { Body, Controller, Delete, Get, Param, Post, UseGuards, BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "src/utils/guards/jwt-auth.guard";
import { APIResponseInterface } from 'src/utils/interfaces/response.interface';
import { ObjectId } from 'mongodb';

@Controller('policy-setting')
@UseGuards(JwtAuthGuard)
export class PolicySettingController {
    constructor(
        private readonly policySettingService: PolicySettingService
    ) { }

    @Post('/upsert')
    async upsertPolicySetting(@Body() policySettingPayload: any): Promise<APIResponseInterface<any>> {
        return await this.policySettingService.upsertPolicySetting(policySettingPayload);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/detail')
    async findByPolicyId(@Body() policySettingPayload: any) {
        return this.policySettingService.findByPolicyId(policySettingPayload);
    }
}