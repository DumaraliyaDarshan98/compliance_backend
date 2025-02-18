import { Module } from '@nestjs/common';
import { EmployeeModule } from '../employee/employee.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
@Module({
    imports: [
        EmployeeModule,
        PassportModule,
        JwtModule.register({
            secret: 'test@123', // Use env variable for security
            signOptions: { expiresIn: '1h' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}
