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

        const employeeList = await this.employeeModel.find({ 'isSendMail': 0 });

        try {
            for (const employee of employeeList) {
                const loginUrl = `${CONFIG.frontURL}login`;
                // const emailContent = `<p>Click <a href="${resetUrl}">here</a> to set your new password.</p>`;
                const emailContent = `<!DOCTYPE html>
                <html>
                <head>
                    <title>Account Registration Successful</title>
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
                            text-align: left;
                        }
                        .content {
                            font-size: 16px;
                            color: #333333;
                            text-align: left;
                        }
                        .button {
                            display: inline-block;
                            margin-top: 20px;
                            padding: 12px 24px;
                            background-color: #007BFF;
                            color: white !important;
                            text-decoration: none;
                            font-size: 16px;
                            border-radius: 5px;
                        }
                        .footer {
                            margin-top: 20px;
                            font-size: 12px;
                            color: #777777;
                            text-align: left;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header-text">Registration Successful</div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>Congratulations! Your account has been successfully registered on the Compliance Portal.</p>
                            <p>You can now login and start your test using the button below:</p>
                            <div>
                                <a href="${loginUrl}" class="button">Login to Compliance Portal</a>
                            </div>
                            <p>Thanks, <br> Compliance Team</p>
                        </div>
                        <p class="footer">
                            If you have any questions, please contact our support team.
                        </p>
                    </div>
                </body>
                </html>
                `;
                await this.mailService.sendResetPasswordEmail(employee.email, emailContent, 'Welcome to Compliance Portal – Your Account is Ready!');

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