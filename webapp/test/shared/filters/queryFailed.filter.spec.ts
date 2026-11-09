import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { QueryFailedFilter } from '../../../src/shared/filters/queryFailed.filter.js';

describe('QueryFailedFilter', () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  const filter = new QueryFailedFilter();

  function queryFailedWithCode(code: string): QueryFailedError {
    return new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('database error'), { code }),
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  it('maps a unique violation to 409', () => {
    filter.catch(queryFailedWithCode('23505'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
  });

  it('maps a foreign key violation to 422', () => {
    filter.catch(queryFailedWithCode('23503'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('maps any other database error to 500 without leaking details', () => {
    filter.catch(queryFailedWithCode('XX000'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });
});
