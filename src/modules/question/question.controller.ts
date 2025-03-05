import { QuestionService } from './question.service';
import { Body, Controller, Delete, Get, Param, Post, UseGuards, BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "src/utils/guards/jwt-auth.guard";
import { APIResponseInterface } from 'src/utils/interfaces/response.interface';
import { ObjectId } from 'mongodb';

@Controller('question')
@UseGuards(JwtAuthGuard)
export class QuestionController {
    constructor(
        private readonly questionService: QuestionService
    ) { }

    @Post('/list')
    async getAllquestion (@Body() questionPayload: any): Promise<APIResponseInterface<any>> {
        return await this.questionService.getAllquestion(questionPayload);
    }

    @Post('/create')
    async createQuestion(@Body() questionPayload: any): Promise<APIResponseInterface<any>> {
        return await this.questionService.createQuestion(questionPayload);
    }

    @Post('/delete')
    async deleteById(@Body() questionPayload: any) {
        return this.questionService.deleteById(questionPayload);
    }

    @Post('/update')
    async updateQuestion(@Body() questionPayload: any) {
        return this.questionService.updateQuestion(questionPayload);
    }

    @Post('/detail')
    async questionDetail(@Body() questionPayload: any) {
        return this.questionService.questionDetail(questionPayload);
    }
}