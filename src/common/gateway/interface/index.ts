import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { Socket } from 'socket.io';

export interface IMySocket extends Socket {
  user?: IUserSession;
}

export interface SocketResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface JoinRoomPayload {
  roomId: string;
  userId?: string;
}

export interface LeaveRoomPayload {
  roomId: string;
  userId?: string;
}
