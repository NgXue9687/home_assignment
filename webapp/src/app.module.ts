import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './features/tasks/tasks.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv } from './shared/config/envValidation.js';
import { DevelopersModule } from './features/developers/developers.module.js';
import { SkillsModule } from './features/skills/skills.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        schema: configService.getOrThrow<string>('DB_SCHEMA'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    TasksModule,
    DevelopersModule,
    SkillsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
