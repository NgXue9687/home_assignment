import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import {
  RequestWithActingUser,
  UserActionGuard,
} from '../../../src/shared/auth/userAction.guard.js';
import { SysMessageFormat } from '../../../src/shared/constants/sysMessages.js';

function contextWithHeader(header: string | undefined) {
  const request = {
    header: vi.fn(() => header),
  } as unknown as RequestWithActingUser;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('UserActionGuard', () => {
  const guard = new UserActionGuard();
  const expectedError = new UnauthorizedException(
    SysMessageFormat.actingUserRequired('x-acting-user', 20),
  );

  it('lets the request through and stores the trimmed acting user', () => {
    const { context, request } = contextWithHeader('  Bob  ');

    expect(guard.canActivate(context)).toBe(true);
    expect(request.actingUser).toBe('Bob');
  });

  it('accepts a name of exactly 20 characters', () => {
    const { context, request } = contextWithHeader('a'.repeat(20));

    expect(guard.canActivate(context)).toBe(true);
    expect(request.actingUser).toBe('a'.repeat(20));
  });

  it.each([undefined, '', '   ', 'a'.repeat(21)])(
    'rejects the header value %j',
    (header) => {
      const { context, request } = contextWithHeader(header);

      expect(() => guard.canActivate(context)).toThrow(expectedError);
      expect(request.actingUser).toBeUndefined();
    },
  );
});
