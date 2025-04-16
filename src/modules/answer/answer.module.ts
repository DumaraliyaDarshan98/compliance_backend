import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnswerService } from './answer.service';
import { AnswerController } from './answer.controller';
import { Answer, AnswerSchema } from './schema/answer.schema';
import { ResultModule } from 'src/modules/result/result.module'; // Import the ResultyModule
import { QuestionModule } from 'src/modules/question/question.module'; // Import the QuestionModule
import { SubPolicyModule } from 'src/modules/sub-policy/sub-policy.module'; // Import the SubPolicyModule
import { OptionModule } from 'src/modules/option/option.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Answer.name, schema: AnswerSchema }]),
        ResultModule,
        QuestionModule,
        SubPolicyModule,
        OptionModule
    ],
    providers: [AnswerService],
    controllers: [AnswerController],
    exports: [AnswerService, MongooseModule]
})
export class AnswerModule {}
