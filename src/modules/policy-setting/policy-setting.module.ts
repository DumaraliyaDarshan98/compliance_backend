import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolicySettingService } from './policy-setting.service';
import { PolicySettingController } from './policy-setting.controller';
import { PolicySetting, PolicySettingSchema } from './schema/policy-setting.schema';
import { PolicyModule } from 'src/modules/policy/policy.module'; // Import the SubPolicyModule

@Module({
    imports: [
        MongooseModule.forFeature([{ name: PolicySetting.name, schema: PolicySettingSchema }]),
        PolicyModule
    ],
    providers: [PolicySettingService],
    controllers: [PolicySettingController],
    exports: [PolicySettingService]
})
export class PolicySettingModule {}
