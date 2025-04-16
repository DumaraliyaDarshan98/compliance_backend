import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class MicrosoftAuthGuard extends AuthGuard('microsoft') {
    handleRequest(err: any, user: any, info: any) {
        console.log('Microsoft guard - Error:', err);
        console.log('Microsoft guard - User:', user);
        console.log('Microsoft guard - Info:', info);

        if (err) {
            if (err instanceof Error) {
                throw new UnauthorizedException(err.message);
            }
            throw new UnauthorizedException('Microsoft authentication failed');
        }

        if (!user) {
            throw new UnauthorizedException('No user data received from Microsoft');
        }

        return user;
    }
}
