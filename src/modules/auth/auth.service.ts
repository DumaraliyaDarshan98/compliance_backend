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
const crypto = require('crypto');

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
      // const emailContent: any = `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`;
      const emailContent: any = `
      <!DOCTYPE html>
<html>
<head>
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            /* text-align: center; */
        }
        .header-text {
            font-size: 24px;
            font-weight: bold;
            color: #333333;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            color: #333333;
        }
        .button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background-color: #007BFF;
            color: black !important;
            text-decoration: none;
            font-size: 16px;
            border-radius: 5px;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #777777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-text">Reset Your Account Password</div>
        <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password for your Compliance Team account. If you made this request, please click the link below to set a new password </p>
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Your Password</a>
            </div>
            <p>
                Thanks, <br>
                Compliance Team
            </p>
            <p class="footer">
                This link will expire in 15 minutes. If you need further assistance, please contact our support team.
            </p>
        </div>
    </div>
</body>
</html>
      `;
      await this.mailService.sendResetPasswordEmail(employee.email, emailContent, 'Reset Your Password');

      employee.resetPasswordToken = resetToken;
      employee.resetPasswordExpires = new Date(Date.now() + 50 * 60 * 1000); // 15 min expiry

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
        // resetPasswordExpires: { $gt: new Date() } // Check if token is still valid
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
      console.log("error", error);
      throw new BadRequestException('Invalid token');
    }
  }

  generateOTP(): string {
    const otp: number = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
  }

  // Function to be used for the checking register user
  async checkRegisterUser(email: string) {
    try {
      if (!email) {
        throw new BadRequestException('Please enter email !');
      }

      const user = await this.employeeModel.findOne({
        email: email,
      });

      if (!user) {
        return {
          message: "User Not found.",
          data: {
            isRegisterUser: false
          }
        }
      }

      if (user?.isActive == 0) {
        return {
          message: "Your account is in-active",
          data: {
            isRegisterUser: false
          }
        }
      }

      // Send OTP to email
      const otp = this.generateOTP();

      // Save otp on table for verification
      user['otp'] = otp || "";
      user['otpTime'] = new Date();

      await user.save();

      console.log("this is OTP", otp);
      const emailContent = `<!DOCTYPE html>
      <html>
      <head>
          <title>Login OTP Verification</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  width: 100%;
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  padding: 20px;
                  border-radius: 5px;
                  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
              }
              .header-text {
                  font-size: 24px;
                  font-weight: bold;
                  color: #333333;
                  margin-bottom: 20px;
              }
              .content {
                  font-size: 16px;
                  color: #333333;
              }
              .otp-box {
                  display: inline-block;
                  margin: 20px 0;
                  padding: 12px 24px;
                  background-color: #007BFF;
                  color: white;
                  font-size: 24px;
                  letter-spacing: 5px;
                  border-radius: 5px;
                  font-weight: bold;
              }
              .footer {
                  margin-top: 20px;
                  font-size: 12px;
                  color: #777777;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header-text">Your Login OTP</div>
              <div class="content">
                  <p>Hello,</p>
                  <p>Use the following One Time Password (OTP) to login to your account. Please enter this OTP on the login page:</p>
                  <div style="text-align: center;">
                      <div class="otp-box">${otp}</div>
                  </div>
                  <p>
                      Thanks, <br>
                      Compliance Team
                  </p>
                  <p class="footer">
                      This OTP is valid for 5 minutes. Please do not share it with anyone.
                  </p>
              </div>
          </div>
      </body>
      </html>
      `;

      await this.mailService.sendResetPasswordEmail(email, emailContent, 'Compliance Login OTP Verification');

      return {
        message: "User found successfully.",
        data: {
          isRegisterUser: true
        }
      }
    } catch (error) {
      console.log("Facing error while checking register user", error)
      throw new BadRequestException('Error during checking register user.');
    }
  }

  // Function to be used for the checking register user
  async verifyOTP(body: { email: string; otp: string }): Promise<APIResponseInterface<any>> {
    try {
      if (!body?.email) {
        throw new BadRequestException('User email address not valid !');
      }

      if (!body?.otp) {
        throw new BadRequestException('Please enter otp !');
      }

      const user = await this.employeeModel.findOne({
        email: body?.email, isActive: 1
      });

      if (!user) {
        return {
          code: 404,
          message: "User Not found.",
          data: null
        }
      }

      const otpValidDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
      const currentTime = new Date().getTime();
      const otpTime = new Date(user.otpTime).getTime();

      if (user.otp !== String(body?.otp)) {
        return {
          code: 400,
          message: "Invalid OTP.",
          data: null
        }
      }

      if (currentTime - otpTime > otpValidDuration) {
        return {
          code: 400,
          message: "OTP expired.",
          data: null
        }
      }

      // Save otp on table for verification
      user['otp'] = null;
      user['otpTime'] = null;

      const employee: any = await user.save();

      const payload = { email: employee.email, id: employee._id, role: employee.role };
      const { password, $__, $isNew, ...employeeData } = employee.toObject();

      return {
        message: "OTP verified successfully.",
        data: { ...employeeData, access_token: this.jwtService.sign(payload) },
      };
    } catch (error) {
      console.log("Facing error verify otp", error)
      throw new BadRequestException('Facing error verify otp');
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
      console.log("error", error)
      throw new BadRequestException('Invalid token');
    }
  }

  async micLogin(req: any, res: any): Promise<void> {
    try {
      console.log('Microsoft login request:', req.user);

      if (!req.user) {
        throw new UnauthorizedException('No user data received from Microsoft');
      }

      const { email, firstName, lastName, displayName, microsoftId } = req.user;

      if (!email) {
        throw new UnauthorizedException('Email is required from Microsoft profile');
      }

      // Find or create user in your database
      let employee = await this.employeeModel.findOne({ email });

      if (!employee) {
        // Create new employee if not exists
        employee = await this.employeeModel.create({
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          displayName: displayName || '',
          microsoftId,
          isActive: true,
          role: 'EMPLOYEE', // Set default role,
          dateOfJoining: new Date()
        });
      }

      // Generate JWT token
      const payload = {
        email: employee.email,
        id: employee._id,
        role: employee.role
      };

      const token = this.jwtService.sign(payload);

      // Redirect to frontend with token
      res.redirect(`${CONFIG.FRONTEND_URL}callback?token=${token}`);
    } catch (error) {
      console.error('Microsoft login error:', error);
      if (error instanceof UnauthorizedException) {
        res.redirect(`${CONFIG.FRONTEND_URL}login?error=${encodeURIComponent(error.message)}`);
      } else {
        res.redirect(`${CONFIG.FRONTEND_URL}login?error=Authentication failed`);
      }
    }
  }
}