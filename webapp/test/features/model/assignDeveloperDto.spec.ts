import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AssignDeveloperDto } from '../../../src/models/dto/request/assignDeveloper.dto.js';

// The same options as main.ts, so the test sees what a request would see.
const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
const parse = (body: unknown) =>
  validationPipe.transform(body, {
    type: 'body',
    metatype: AssignDeveloperDto,
  });

const developerUuid = '3f2b8c1e-5d4a-4b6e-9c7d-1a2b3c4d5e6f';

describe('AssignDeveloperDto', () => {
  it('accepts a developer uuid', async () => {
    await expect(parse({ developerUuid })).resolves.toMatchObject({
      developerUuid,
    });
  });

  it('accepts null, which removes the assignee', async () => {
    await expect(parse({ developerUuid: null })).resolves.toMatchObject({
      developerUuid: null,
    });
  });

  it('treats an empty string as null', async () => {
    await expect(parse({ developerUuid: '' })).resolves.toMatchObject({
      developerUuid: null,
    });
  });

  it.each([
    {},
    { developerUuid: 'not-a-uuid' },
    { developerUuid: 123 },
    { developerUuid, extra: true },
  ])('rejects %j', async (body) => {
    await expect(parse(body)).rejects.toBeInstanceOf(BadRequestException);
  });
});
