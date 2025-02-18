import { Injectable, UnauthorizedException } from "@nestjs/common";
import { EmployeeService } from "../employee/employee.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly employeeService: EmployeeService,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const employee = await this.employeeService.findByEmail(email);
        if (!employee) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        return employee;
    }

    async login(employee: any) {
        const payload = { email: employee.email, sub: employee._id };
        return {
            data: employee,
            access_token: this.jwtService.sign(payload),
        };
    }
}