import { BadRequestException, Injectable } from '@nestjs/common';
import { ITokens } from '../interfaces/auth.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { IGoogleUser } from '../interfaces/google.interface';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  // New method for Google OAuth login
  googleLogin(googleUser: IGoogleUser): Promise<ITokens> {
    const { id: providerId, name, emails } = googleUser;
    const email = emails[0].value;
    const fullName = `${name.givenName} ${name.familyName}`;

    return this.prisma.$transaction(async (trx: PrismaService) => {
      // Check if user exists with this Google account
      let user = await trx.users.findFirst({
        where: {
          provider: 'google',
          providerId: providerId,
          isDeleted: false,
        },
      });

      if (!user) {
        // Check if user exists with same email but different provider
        const existingUser = await trx.users.findFirst({
          where: { email: email, isDeleted: false },
        });

        if (existingUser) {
          // Link Google account to existing user
          user = await trx.users.update({
            where: { id: existingUser.id },
            data: {
              provider: 'google',
              providerId: providerId,
              authMethod: 'oauth',
              isVerified: true, // Google accounts are pre-verified
              lastLoginAt: new Date(),
            },
          });
        } else {
          // Create new user with Google account
          user = await trx.users.create({
            data: {
              fullName: fullName,
              email: email,
              provider: 'google',
              providerId: providerId,
              authMethod: 'oauth',
              isVerified: true, // Google accounts are pre-verified
              lastLoginAt: new Date(),
            },
          });
        }
      } else {
        // Update existing Google user's info and last login
        user = await trx.users.update({
          where: { id: user.id },
          data: {
            fullName: fullName,
            lastLoginAt: new Date(),
          },
        });
      }

      // Generate tokens
      const tokens = await this.authService.generateTokens(user, trx);

      return {
        ...tokens,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          isVerified: user.isVerified,
          authMethod: user.authMethod,
          provider: user.provider,
        },
      };
    });
  }

  // Method to handle OAuth callback
  handleOAuthCallback(profile: {
    id: string;
    name: { givenName: string; familyName: string };
    emails: { value: string }[];
    photos: { value: string }[];
  }) {
    try {
      const googleUser: IGoogleUser = {
        id: profile.id,
        name: {
          givenName: profile.name.givenName,
          familyName: profile.name.familyName,
        },
        emails: profile.emails,
        photos: profile.photos,
      };

      return this.googleLogin(googleUser);
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new BadRequestException('OAuth authentication failed');
    }
  }
}
