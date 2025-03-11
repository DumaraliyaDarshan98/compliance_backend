import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { Employee, EmployeeSchema } from './schema/employee.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MailerService } from 'src/utils/mailer/mailer.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }]),
        JwtModule.register({
            secret: 'test@123', // Use env variable for security
            signOptions: { expiresIn: '23h' },
        }),
    ],
    providers: [EmployeeService, JwtService, MailerService],
    controllers: [EmployeeController],
    exports: [EmployeeService, MongooseModule]
})
export class EmployeeModule { }
