import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { EmployeeService } from "../employee/employee.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import { Employee, EmployeeDocument } from "../employee/schema/employee.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MailerService } from "src/utils/mailer/mailer.service";
import { CONFIG } from "src/utils/keys/keys";

@Injectable()
export class AuthService {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailerService,
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
  ) { }

  async validateUser(email: string, password: string) {
    const employee = await this.employeeService.findByEmail(email);
    if (!employee) {
      throw new UnauthorizedException('Invalid email or password');
    }
    console.log("password, employee.password", password, employee.password);
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    console.log("https://onedrive.live.com/edit?id=2107246D8F128D9F!173486&resid=2107246D8F128D9F!173486&ithint=file%2cxlsx&authkey=!AD8Hxh7KHFZ2CiQ&wdo=2&cid=2107246d8f128d9f", employee);
    return employee;
  }

  async login(body: { email: string; password: string }): Promise<APIResponseInterface<any>> {
    const employee: any = await this.validateUser(body.email, body.password);
    const payload = { email: employee.email, id: employee._id, role: employee.role };
    const { password, $__, $isNew, ...employeeData } = employee.toObject();
    console.log("{ ...employee, access_token: this.jwtService.sign(payload) }", { ...employee, access_token: this.jwtService.sign(payload) })
    return {
      data: { ...employeeData, access_token: this.jwtService.sign(payload) },
    };
  }

  async requestPasswordReset(email: string): Promise<APIResponseInterface<any>> {
    try {
      const employee = await this.employeeModel.findOne({ email });

      if (!employee) {
        throw new NotFoundException('employee not found');
      }

      // Generate reset token (valid for 15 minutes)
      const payload = { id: employee?._id, email: employee.email, role: employee.role };

      const resetToken = this.jwtService.sign(payload);

      // Mail send to user
      const resetUrl = `${CONFIG.frontURL}reset?token=${resetToken}`;
      const emailContent: any = `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`;
      await this.mailService.sendResetPasswordEmail(employee.email, emailContent, 'Reset Your Password');

      employee.resetPasswordToken = resetToken;
      employee.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

      await employee.save();

      return { message: 'Password reset link sent to email', data: { token: resetToken } };
    } catch (error) {
      console.error("Error requestPasswordReset:", error);
      throw new InternalServerErrorException("Failed to requestPasswordReset");
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = this.jwtService.verify(token);
      console.log("decoded", decoded);
      const user = await this.employeeModel.findOne({
        _id: decoded.id,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() } // Check if token is still valid
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired token');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      // Clear reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return { message: 'Password updated successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid token');
    }
  }

  async createPassword(token: string, newPassword: string) {
    try {
      if (!token) {
        throw new BadRequestException('Invalid email');
      }

      const user = await this.employeeModel.findOne({
        email: token,
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired token');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      await user.save();

      return { message: 'Password updated successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid token');
    }
  }
}