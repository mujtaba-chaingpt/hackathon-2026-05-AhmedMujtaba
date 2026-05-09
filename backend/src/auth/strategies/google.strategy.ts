import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../db/models/user.model';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;
    const email = emails?.[0]?.value ?? '';
    const picture = photos?.[0]?.value ?? null;

    let user = await this.userModel.findOne({ where: { googleId: id } });

    if (!user) {
      user = await this.userModel.create({
        googleId: id,
        email,
        name: displayName,
        picture,
        coinBalance: 1000,
      });
    } else {
      // Update profile info in case it changed
      await user.update({ email, name: displayName, picture });
    }

    done(null, user);
  }
}
