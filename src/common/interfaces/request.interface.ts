import { IUserSession } from '@modules/auth/interfaces/auth.interface';

export interface IRequest extends Request {
  user?: IUserSession;
}
