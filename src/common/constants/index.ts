import * as dotenv from 'dotenv';
dotenv.config();

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  CREATE: 'create',
  UPDATE: 'update',
  ASSIGN: 'assign',
  PASSWORD: 'password',
} as const;

export const RESOURCES = {
  AUTH: 'auth',
  USERS: 'users',
  ROLES: 'roles',
  FILES: 'files',
  JOBS: 'jobs',
  QUEUE: 'queue',
  SUBJECTS: 'subjects',
  QUESTIONS: 'questions',
  ANSWERS: 'answers',
  TICKETS: 'tickets',
} as const;

export const JWT_CONSTANTS = {
  ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET || 'your-access-token-secret',
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
  ACCESS_TOKEN_EXPIRATION: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '7d',
  REFRESH_TOKEN_EXPIRATION: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d',
} as const;
