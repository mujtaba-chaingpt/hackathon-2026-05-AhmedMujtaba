import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Passport handles the redirect to Google OAuth consent screen
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response): Promise<void> {
    const user = req.user;
    const jwt = this.authService.generateToken(user);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${jwt}`;
    res.redirect(redirectUrl);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { id: string; email: string }) {
    const profile = await this.authService.getProfile(user.id);
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      coinBalance: profile.coinBalance,
    };
  }
}
