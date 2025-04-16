import { Module } from '@nestjs/common';
import { EmployeeModule } from '../employee/employee.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { Employee, EmployeeSchema } from '../employee/schema/employee.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerService } from 'src/utils/mailer/mailer.service';
import { MicrosoftStrategy } from './microsoft.strategy';
@Module({
    imports: [
        EmployeeModule,
        PassportModule,
        JwtModule.register({
            secret: 'test@123', // Use env variable for security
            signOptions: { expiresIn: '23h' },
        }),
        // PassportModule.register({ session: false }),
        MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }]),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, MailerService, MicrosoftStrategy],
    exports: [AuthService, JwtStrategy, MicrosoftStrategy],
})
export class AuthModule { }
