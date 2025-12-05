import { IUser } from '@modules/users/interfaces/user.interface';

export interface ILoginDto {
  email?: string;
  phoneNumber?: string;
  password: string;
}

export interface IRegisterDto {
  fullName: string;
  email?: string;
  phoneNumber?: string;
  password: string;
}

export interface ITokenPayload {
  id: string;
  email?: string;
  phoneNumber?: string;
  sessionId: string;
  isVerified?: boolean;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
}

export interface IRefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserSession extends IUser {
  id: string;
  fullName: string;
  token?: string;
  email?: string;
  phoneNumber?: string;
  userId: string;
  sessionId?: string;
  isVerified: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}
