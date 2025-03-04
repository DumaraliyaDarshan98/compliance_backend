import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubPolicyService } from './sub-policy.service';
import { SubPolicyController } from './sub-policy.controller';
import { SubPolicy, SubPolicySchema } from './schema/sub-policy.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: SubPolicy.name, schema: SubPolicySchema }])
    ],
    providers: [SubPolicyService],
    controllers: [SubPolicyController],
    exports: [SubPolicyService]
})
export class SubPolicyModule {}
