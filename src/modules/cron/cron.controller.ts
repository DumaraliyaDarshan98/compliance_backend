import { CronService } from './cron.service';
import { Body, Controller, Delete, Get, Param, Post, UseGuards, BadRequestException } from "@nestjs/common";
import { APIResponseInterface } from 'src/utils/interfaces/response.interface';
import { ObjectId } from 'mongodb';

@Controller('cron')
export class CronController {
    constructor(
        private readonly cronService: CronService
    ) { }

    @Get('/send-set-password-mail')
    async sendSetPasswordMail(): Promise<APIResponseInterface<any>> {
        return await this.cronService.sendSetPasswordMail();
    }
}