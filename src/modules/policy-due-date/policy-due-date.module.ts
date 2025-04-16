import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolicyDueDateService } from './policy-due-date.service';
import { PolicyDueDateController } from './policy-due-date.controller';
import { PolicyDueDate, PolicyDueDateSchema } from './schema/policy-due-date.schema';
import { SubPolicyModule } from 'src/modules/sub-policy/sub-policy.module'; // Import the SubPolicyModule
import { EmployeeModule } from 'src/modules/employee/employee.module'; // Import the SubPolicyModule

@Module({
    imports: [
        MongooseModule.forFeature([{ name: PolicyDueDate.name, schema: PolicyDueDateSchema }]),
        SubPolicyModule,
        EmployeeModule
    ],
    providers: [PolicyDueDateService],
    controllers: [PolicyDueDateController],
    exports: [PolicyDueDateService, MongooseModule]
})
export class PolicyDueDateModule {}
