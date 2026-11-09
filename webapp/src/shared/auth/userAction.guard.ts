import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SysMessageFormat } from '../constants/sysMessages.js';

export type RequestWithActingUser = Request & { actingUser?: string };

const ACTING_USER_HEADER = 'x-acting-user';
const MAX_ACTING_USER_LENGTH = 20; // createdby / modifiedby are varchar(20)

// TEMPORARY: replace with a real authentication guard that sets request.actingUser
@Injectable()
export class UserActionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithActingUser>();
    const actingUser = request.header(ACTING_USER_HEADER)?.trim();
    if (!actingUser || actingUser.length > MAX_ACTING_USER_LENGTH) {
      throw new UnauthorizedException(
        SysMessageFormat.actingUserRequired(
          ACTING_USER_HEADER,
          MAX_ACTING_USER_LENGTH,
        ),
      );
    }
    request.actingUser = actingUser;
    return true;
  }
}
