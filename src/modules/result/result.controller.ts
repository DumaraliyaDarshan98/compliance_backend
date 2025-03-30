import { ResultService } from './result.service';
import { Body, Controller, Delete, Get, Param, Post, UseGuards, BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "src/utils/guards/jwt-auth.guard";
import { APIResponseInterface } from 'src/utils/interfaces/response.interface';
import { ObjectId } from 'mongodb';
import { CurrentUser} from 'src/utils/decorators/get-user.decorator'

@Controller('result')
@UseGuards(JwtAuthGuard)
export class ResultController {
    constructor(
        private readonly resultService: ResultService
    ) { }

    @Post('/list')
    @UseGuards(JwtAuthGuard) 
    async getList (@Body() resultPayload: any): Promise<APIResponseInterface<any>> {
        return await this.resultService.getList(resultPayload);
    }

    @Post('/out-stading-list')
    @UseGuards(JwtAuthGuard) 
    async getOutStandingList (@Body() resultPayload: any): Promise<APIResponseInterface<any>> {
        return await this.resultService.getOutStandingList(resultPayload);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/admin-test-employee-list')
    async getAdminTestEmployeeList(@Body() resultPayload: any) {
        return this.resultService.getAdminTestEmployeeList(resultPayload);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/employee-result-list')
    async getEmployeeResultList(@Body() resultPayload: any) {
        return this.resultService.getEmployeeResultList(resultPayload);
    }
}