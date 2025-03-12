import { Body, Controller, Patch, Post, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() body: { email: string; password: string }): Promise<APIResponseInterface<any>> {
        // const employee = await this.authService.validateUser(body.email, body.password);
        return await this.authService.login(body);
    }

    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string): Promise<APIResponseInterface<any>> {
        return await this.authService.requestPasswordReset(email);
    }

    @Patch('reset-password')
    async resetPassword(
        @Query('token') token: string,
        @Body('password') password: string
    ): Promise<APIResponseInterface<any>> {
        return await this.authService.resetPassword(token, password);
    }

    @Patch('create-password')
    async createPassword(
        @Query('token') token: string,
        @Body('password') password: string
    ): Promise<APIResponseInterface<any>> {
        return await this.authService.createPassword(token, password);
    }
}