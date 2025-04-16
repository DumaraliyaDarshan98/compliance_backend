import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Result, ResultSchema } from './schema/result.schema';
import { ResultService } from './result.service';
import { ResultController } from './result.controller';
import { SubPolicyModule } from 'src/modules/sub-policy/sub-policy.module'; // Import the SubPolicyModule
import { PolicySettingModule } from 'src/modules/policy-setting/policy-setting.module'; // Import the SubPolicyModule
import { EmployeeModule } from 'src/modules/employee/employee.module';
import { AcceptTermConditionModule } from 'src/modules/accept-term-condition/accept-term-condition.module';
import { PolicyModule } from 'src/modules/policy/policy.module'; // Import the SubPolicyModule

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Result.name, schema: ResultSchema }]),
        SubPolicyModule,
        PolicySettingModule,
        EmployeeModule,
        AcceptTermConditionModule,
        PolicyModule
    ],
    providers: [ResultService],
    controllers: [ResultController],
    exports: [ResultService, MongooseModule]
})
export class ResultModule {}
