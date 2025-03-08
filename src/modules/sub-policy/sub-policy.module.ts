import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolicySettingModule } from 'src/modules/policy-setting/policy-setting.module';
import { SubPolicyService } from './sub-policy.service';
import { SubPolicyController } from './sub-policy.controller';
import { SubPolicy, SubPolicySchema } from './schema/sub-policy.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: SubPolicy.name, schema: SubPolicySchema }]),
        forwardRef(() => PolicySettingModule), 
    ],
    providers: [SubPolicyService],
    controllers: [SubPolicyController],
    exports: [SubPolicyService, MongooseModule]
})
export class SubPolicyModule {}
