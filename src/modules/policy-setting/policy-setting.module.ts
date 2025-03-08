import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolicySettingService } from './policy-setting.service';
import { PolicySettingController } from './policy-setting.controller';
import { PolicySetting, PolicySettingSchema } from './schema/policy-setting.schema';
import { SubPolicyModule } from 'src/modules/sub-policy/sub-policy.module'; // Import the SubPolicyModule

@Module({
    imports: [
        MongooseModule.forFeature([{ name: PolicySetting.name, schema: PolicySettingSchema }]),
        forwardRef(() => SubPolicyModule), 
    ],
    providers: [PolicySettingService],
    controllers: [PolicySettingController],
    exports: [PolicySettingService, MongooseModule]
})
export class PolicySettingModule {}
