import { IPermission, IRole } from '@modules/roles/interfaces/role.interface';

export interface IUser {
  id: string;
  email: string;
  password?: string;
  fullName?: string;
  role?: string;
  isVerified?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  roles?: IRole[];
  permissions?: IPermission[];
  blockedAt: boolean;
}

export interface ICreateUserDto {
  email: string;
  password: string;
  fullName: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface IUpdateUserDto {
  email?: string;
  password?: string;
  fullName?: string;
  is_active?: boolean;
  is_verified?: boolean;
}
