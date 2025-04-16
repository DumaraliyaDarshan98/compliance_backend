import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { CONFIG } from 'src/utils/keys/keys';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    console.log("this is testing data", configService.get<string>('CLIENT_SECRET'));
    super({
      clientID: CONFIG.CLIENT_ID,
      clientSecret: configService.get<string>('CLIENT_SECRET'),
      callbackURL: CONFIG.REDIRECT_URI,
      scope: ['user.read', 'profile', 'email', 'openid'],
      tenant: CONFIG.TENANT_ID,
      authorizationURL: `https://login.microsoftonline.com/${CONFIG.TENANT_ID}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${CONFIG.TENANT_ID}/oauth2/v2.0/token`,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    console.log('Microsoft profile received:', profile);

    if (!profile) {
      console.error('No profile data received');
      throw new Error('No profile data received from Microsoft');
    }

    // Extract email from userPrincipalName if emails array is empty
    let email = '';
    if (profile.emails && profile.emails.length > 0) {
      email = profile.emails[0].value;
    } else if (profile.userPrincipalName) {
      // Remove the #EXT# part if it exists
      email = profile.userPrincipalName.split('#')[0];
    }

    if (!email) {
      console.error('No email found in profile');
      throw new Error('No email found in Microsoft profile');
    }

    const user = {
      email,
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      displayName: profile.displayName || '',
      microsoftId: profile.id,
      accessToken,
    };

    console.log('Processed user data:', user);
    return user;
  }
}
