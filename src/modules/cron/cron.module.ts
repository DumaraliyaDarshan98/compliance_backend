import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { EmployeeModule } from 'src/modules/employee/employee.module';
import { MailerService } from 'src/utils/mailer/mailer.service';

@Module({
    imports: [
        MongooseModule,
        EmployeeModule 
    ],
    providers: [CronService,MailerService],
    controllers: [CronController],
    exports: [CronService, MongooseModule]
})
export class CronModule {}
