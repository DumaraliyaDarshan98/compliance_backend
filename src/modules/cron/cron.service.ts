import {
    BadRequestException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { APIResponseInterface } from 'src/utils/interfaces/response.interface';
import { Employee, EmployeeDocument } from "src/modules/employee/schema/employee.schema";
import * as mongoose from 'mongoose';
import { MailerService } from "src/utils/mailer/mailer.service";
import { CONFIG } from "src/utils/keys/keys";

@Injectable()
export class CronService {
    constructor(
        private readonly mailService: MailerService,
        @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    ) { }

    async sendSetPasswordMail(): Promise<APIResponseInterface<any>> {

    const employeeList = await this.employeeModel.find({ 'isSendMail' : 0});

    try { 
       for (const employee of employeeList) {
        const resetUrl = `${CONFIG.frontURL}create-password?token=${employee.email}`;
            console.log('resetUrl', resetUrl);

        const emailContent = `<!DOCTYPE html>
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
                <div class="header-text">Set Your Account Password</div>
                <div class="content">
                    <p>Hello,</p>
                    <p>Welcome to Team! Your account has been successfully created. To access your account, please set up your password using the link below </p>
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button">Set New Password</a>
                    </div>
                    <p>
                        Thanks, <br>
                        Compliance Team
                    </p>
                    <p class="footer">
                        This link will expire in 30 minutes. If you need further assistance, please contact our support team.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;

        await this.mailService.sendResetPasswordEmail(employee.email, emailContent, 'Set Your Password');

        employee.isSendMail = 1;
        await employee.save();
      }

      return {
        status: 200,
        message: 'Send Mail successfully',
      } as APIResponseInterface<any>;
    } catch (error) {
      console.log('Error during employee update:', error);
      throw new InternalServerErrorException('Failed to update employee');
    }
  }
}