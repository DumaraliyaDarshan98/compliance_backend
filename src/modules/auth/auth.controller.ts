import { Body, Controller, Get, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import { MicrosoftAuthGuard } from "src/utils/guards/microsoft-auth.guard";
import { CONFIG } from "src/utils/keys/keys";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

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

    @Get('microsoft')
    @UseGuards(MicrosoftAuthGuard)
    async microsoftAuth() {
        // This will be handled by the guard
    }

    @Get('microsoft/redirect')
    @UseGuards(MicrosoftAuthGuard)
    async microsoftAuthRedirect(@Req() req: any, @Res() res: any): Promise<void> {
        try {
            console.log('Microsoft redirect - User data:', req.user);
            await this.authService.micLogin(req, res);
        } catch (error) {
            console.error('Microsoft redirect error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            res.redirect(`${CONFIG.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`);
        }
    }
}