import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithActingUser } from './userAction.guard.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const actingUser = context
      .switchToHttp()
      .getRequest<RequestWithActingUser>().actingUser;
    if (!actingUser) throw new UnauthorizedException();
    return actingUser;
  },
);
