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
    async getList (@Body() resultPayload: any, @CurrentUser() currentUser: any): Promise<APIResponseInterface<any>> {
        
        if (!resultPayload) {
            resultPayload = {};
        }

        resultPayload.userId = currentUser.id;
        return await this.resultService.getList(resultPayload);
    }

}