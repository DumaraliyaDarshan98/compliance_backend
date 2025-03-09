import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Result, ResultSchema } from './schema/result.schema';
import { ResultService } from './result.service';
import { ResultController } from './result.controller';
import { SubPolicyModule } from 'src/modules/sub-policy/sub-policy.module'; // Import the SubPolicyModule

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Result.name, schema: ResultSchema }]),
        SubPolicyModule
    ],
    providers: [ResultService],
    controllers: [ResultController],
    exports: [ResultService, MongooseModule]
})
export class ResultModule {}
