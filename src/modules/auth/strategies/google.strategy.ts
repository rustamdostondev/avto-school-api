import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { GoogleAuthService } from '../services/google.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly googleAuthService: GoogleAuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        `http://localhost:${process.env.PORT || 5001}/auth/google/callback`,
      scope: ['profile', 'email'],
    });

    // Validate required environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error(
        'Google OAuth credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      // Validate profile data
      if (!profile?.id || !profile?.emails?.[0]?.value) {
        throw new UnauthorizedException('Invalid Google profile data');
      }

      // Use the GoogleAuthService to handle OAuth callback
      const result = await this.googleAuthService.handleOAuthCallback(profile);

      // Return the result (tokens + user info)
      done(null, result);
    } catch (error) {
      console.error('Google OAuth validation error:', error.message);
      done(error, null);
    }
  }
}
