import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { CONFIG } from '../keys/keys';

@Injectable()
export class MailerService {
    private transporter: any;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail', // or use 'smtp' configuration
            auth: {
                user: CONFIG.email, // Your email
                pass: CONFIG.password, // App password or actual password
            },
        });
    }

    async sendResetPasswordEmail(to: string, content: any) {
        const mailOptions = {
            from: CONFIG.email,
            to,
            subject: 'Reset Your Password',
            html: content
            //   html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Reset password email sent');
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send reset password email');
        }
    }
}
