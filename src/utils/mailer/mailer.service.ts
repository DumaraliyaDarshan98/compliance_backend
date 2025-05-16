// import { Injectable } from '@nestjs/common';
// import * as nodemailer from 'nodemailer';
// import { CONFIG } from '../keys/keys';

// @Injectable()
// export class MailerService {
//     private transporter: any;

//     constructor() {
//         // this.transporter = nodemailer.createTransport({
//         //     service: 'gmail', // or use 'smtp' configuration
//         //     auth: {
//         //         user: CONFIG.email, // Your email
//         //         pass: CONFIG.password, // App password or actual password
//         //     },
//         // });
//         // const nodemailer = require('nodemailer');

//         this.transporter = nodemailer.createTransport({
//             host: "smtp.office365.com",
//             port: 587,
//             secure: false, // use START TLS
//             auth: {
//                 user: CONFIG.email, // Your email
//                 pass: CONFIG.password, // App password or actual password
//             },
//             tls: {
//                 rejectUnauthorized: false
//             }
//         });
//     }

//     async sendResetPasswordEmail(to: string, content: any, title?: string) {
//         const mailOptions = {
//             from: CONFIG.email,
//             to,
//             subject: title || 'Reset Your Password',
//             html: content
//             //   html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
//         };

//         try {
//             await this.transporter.sendMail(mailOptions);
//             console.log('Email sent successfully : ', to);
//         } catch (error) {
//             console.error('Error sending email:', to + ' : ' + error);
//             throw new Error('Failed to send reset password email');
//         }
//     }
// }

import { Injectable } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';

@Injectable()
export class MailerService {
   private graphClient;

  constructor() {
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID,
      process.env.AZURE_CLIENT_ID,
      process.env.AZURE_CLIENT_SECRET
    );

    this.graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken('https://graph.microsoft.com/.default');
          return token?.token;
        },
      },
    });
  }

  async sendResetPasswordEmail(to: string, htmlBody: string , subject: string) {
    const message = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: htmlBody,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
        from: {
          emailAddress: {
            address: process.env.FROM_EMAIL, // must match a mailbox
          },
        },
      },
      saveToSentItems: 'false',
    };

    try {
      await this.graphClient.api('/users/' + process.env.FROM_EMAIL + '/sendMail')
        .post(message);
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Failed to send mail:', error);
      throw new Error('Email sending failed');
    }
  }
}

