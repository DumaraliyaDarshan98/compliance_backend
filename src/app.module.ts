import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CONFIG } from './utils/keys/keys';
import { EmployeeModule } from './modules/employee/employee.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseFormateInterceptor } from './utils/interceptors/response.interceptor';
import { PolicyModule } from './modules/policy/policy.module';
import { SubPolicyModule } from './modules/sub-policy/sub-policy.module';
import { PolicySettingModule } from './modules/policy-setting/policy-setting.module';
import { QuestionModule } from './modules/question/question.module';
import { AnswerModule } from './modules/answer/answer.module';
import { ResultModule } from './modules/result/result.module';

@Module({
  imports: [
    MongooseModule.forRoot(CONFIG.databaseUrl),
    EmployeeModule,
    AuthModule,
    PolicyModule,
    PolicySettingModule,
    QuestionModule,
    AnswerModule,
    ResultModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseFormateInterceptor
    }
  ],
})
export class AppModule {}
