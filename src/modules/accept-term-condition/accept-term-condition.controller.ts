import { Body, Controller, Delete, Get, Param, Post, UseGuards, BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "src/utils/guards/jwt-auth.guard";
import { APIResponseInterface } from 'src/utils/interfaces/response.interface';
import { ObjectId } from 'mongodb';
import { CurrentUser} from 'src/utils/decorators/get-user.decorator'
import { AcceptTermConditionService } from './accept-term-condition.service';

@Controller('accept-term-condition')
@UseGuards(JwtAuthGuard)
export class AcceptTermConditionController {
    constructor(
        private readonly acceptTermConditionService: AcceptTermConditionService
    ) { }

    @Post('/save')
    async saveDetail (@Body() payload: any, @CurrentUser() currentUser: any): Promise<APIResponseInterface<any>> {
        payload.createdBy = currentUser.id;
        return await this.acceptTermConditionService.saveDetail(payload);
    }

    @Post('/detail')
    async getDetail (@Body() payload: any): Promise<APIResponseInterface<any>> {
        return await this.acceptTermConditionService.getDetail(payload);
    }

    @Post('/get-sub-policy-condition-list')
    async getSubPolicyConditionList (@Body() payload: any): Promise<APIResponseInterface<any>> {
        return await this.acceptTermConditionService.getSubPolicyConditionList(payload);
    }    
}