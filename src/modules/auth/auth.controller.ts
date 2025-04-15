import { Body, Controller, Get, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { APIResponseInterface } from "src/utils/interfaces/response.interface";
import { MicrosoftAuthGuard } from "src/utils/guards/microsoft-auth.guard";
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
        // Redirects to Microsoft login
    }

    @Get('microsoft/redirect')
    @UseGuards(MicrosoftAuthGuard)
    async microsoftAuthRedirect(@Req() req: any, @Res() res: any): Promise<any> {
        return await this.authService.micLogin(req, res);
        // console.log("useruseruseruseruseruser")
        // const user = req.user.profile;
        // console.log("user", user)
        // const token = this.jwtService.sign({ email: user.emails[0], name: user.displayName });

        // // Redirect to frontend with token
        // return res.redirect(`${CONFIG.FRONTEND_URL}?token=${token}`);
    }
}