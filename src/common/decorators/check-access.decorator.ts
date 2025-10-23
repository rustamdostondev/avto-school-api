import { SetMetadata } from '@nestjs/common';

export const CHECK_ACCESS_KEY = 'checkAccess';
export const CheckAccess = () => SetMetadata(CHECK_ACCESS_KEY, true);
