import { AnswerService } from './answer.service';
import { Body, Controller, Delete, Get, Param, Post, UseGuards, BadRequestException, Request } from "@nestjs/common";
import { JwtAuthGuard } from 'src/utils/guards/jwt-auth.guard'; // Assuming you're using JwtAuthGuard
import { APIResponseInterface } from 'src/utils/interfaces/response.interface';
import { ObjectId } from 'mongodb';
import { CurrentUser} from 'src/utils/decorators/get-user.decorator'

@Controller('answer')
@UseGuards(JwtAuthGuard) // Protect the route with JwtAuthGuard
export class AnswerController {
    constructor(
        private readonly answerService: AnswerService
    ) { }

    @Post('/save')
    @UseGuards(JwtAuthGuard) 
    async saveAnswer (@Body() answerPayload: any, @CurrentUser() currentUser: any ): Promise<APIResponseInterface<any>> {
        answerPayload.userId = currentUser.id;
        return await this.answerService.saveAnswer(answerPayload);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/get-test-question-list')
    async getTestQuestionList(@Body() answerPayload: any) {
        return this.answerService.getTestQuestionList(answerPayload);
    }
}