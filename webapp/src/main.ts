import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe } from '@nestjs/common';
import { QueryFailedFilter } from './shared/filters/queryFailed.filter.js';
import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  if (process.env.NODE_ENV !== 'production') {
    // Dev only: the API tester page at /apiTester.html, served from the API's own address.
    app.useStaticAssets(join(import.meta.dirname, '..', 'tools'));
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that have no decorator
      forbidNonWhitelisted: true, // ...and reject the request if any were sent
      transform: true, // turn the plain JSON into a real DTO instance (runs @Transform)
    }),
  );

  app.useGlobalFilters(new QueryFailedFilter());
  app.enableShutdownHooks(); // close the database connection cleanly on SIGTERM / Ctrl+C

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Application listening on port ${port}`, 'Bootstrap');
}
await bootstrap();
