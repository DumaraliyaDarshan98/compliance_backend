import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { OptionModule } from 'src/modules/option/option.module';
import { Question, QuestionSchema } from './schema/question.schema';
import { SubPolicyModule } from 'src/modules/sub-policy/sub-policy.module'; // Import the SubPolicyModule

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema }]),
        SubPolicyModule,
        OptionModule
    ],
    providers: [QuestionService],
    controllers: [QuestionController],
    exports: [QuestionService, MongooseModule]
})
export class QuestionModule {}
