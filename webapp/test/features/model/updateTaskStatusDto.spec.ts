import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { UpdateTaskStatus } from '../../../src/models/dto/updateTaskStatus.dto.js';


// The same options as main.ts, so the test sees what a request would see.
const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
const parse = (body: unknown) =>
  validationPipe.transform(body, { type: 'body', metatype: UpdateTaskStatus });

describe('UpdateTaskStatus', () => {
  it.each(['T', 'P', 'D'])('accepts the status %s', async (status) => {
    await expect(parse({ status })).resolves.toMatchObject({ status });
  });

  it.each([
    {},
    { status: null },
    { status: 'X' },
    { status: 'd' },
    { status: 1 },
  ])('rejects %j', async (body) => {
    await expect(parse(body)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects fields it does not know', async () => {
    await expect(
      parse({ status: 'D', taskTitle: 'sneaky' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});