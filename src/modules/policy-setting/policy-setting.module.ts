import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolicySettingService } from './policy-setting.service';
import { PolicySettingController } from './policy-setting.controller';
import { PolicySetting, PolicySettingSchema } from './schema/policy-setting.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: PolicySetting.name, schema: PolicySettingSchema }])
    ],
    providers: [PolicySettingService],
    controllers: [PolicySettingController],
    exports: [PolicySettingService]
})
export class PolicySettingModule {}
