import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { CONFIG } from 'src/utils/keys/keys';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor() {
    super({
      clientID: CONFIG.CLIENT_ID,
      clientSecret: CONFIG.CLIENT_SECRET,
      callbackURL: CONFIG.REDIRECT_URI,
      scope: ['user.read'],
      tenant: CONFIG.TENANT_ID,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    // You can log or process the Microsoft profile here
    console.log("profile", profile);
    done(null, {
      profile,
      accessToken,
    });
  }
}
