import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolicyService } from './policy.service';
import { PolicyController } from './policy.controller';
import { Policy, PolicySchema } from './schema/policy.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Policy.name, schema: PolicySchema }])
    ],
    providers: [PolicyService],
    controllers: [PolicyController],
    exports: [PolicyService, MongooseModule]
})
export class PolicyModule {}
