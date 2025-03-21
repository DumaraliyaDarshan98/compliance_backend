import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AcceptTermCondition, AcceptTermConditionSchema } from './schema/accept-term-condition.schema';
import { AcceptTermConditionService } from './accept-term-condition.service';
import { AcceptTermConditionController } from './accept-term-condition.controller';
import { EmployeeModule } from 'src/modules/employee/employee.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: AcceptTermCondition.name, schema: AcceptTermConditionSchema }]),
        EmployeeModule
    ],
    providers: [AcceptTermConditionService],
    controllers: [AcceptTermConditionController],
    exports: [AcceptTermConditionService, MongooseModule]
})
export class AcceptTermConditionModule {}
