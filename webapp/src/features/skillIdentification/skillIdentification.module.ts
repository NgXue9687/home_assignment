import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillEntity } from '../../models/entity/skill.entity.js';
import { SkillIdentificationService } from './skillIdentification.service.js';
import { LLM_CLIENT, type LlmClient } from './llm/llmClient.js';
import { createLlmClient } from './llm/llmClientFactory.js';

@Module({
  imports: [TypeOrmModule.forFeature([SkillEntity])],
  providers: [
    SkillIdentificationService,
    {
      provide: LLM_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): LlmClient | null => {
        const { client, disabledReason } = createLlmClient({
          provider: configService.get<string>('LLM_PROVIDER'),
          apiKey: configService.get<string>('LLM_API_KEY'),
          model: configService.get<string>('LLM_MODEL'),
          baseUrl: configService.get<string>('LLM_BASE_URL'),
          timeoutMs: configService.get<number>('LLM_TIMEOUT_MS'),
        });
        const logger = new Logger(SkillIdentificationModule.name);
        if (client) {
          logger.log(`Skill identification uses ${client.constructor.name}`);
        } else {
          logger.warn(
            `Skill identification is off (${disabledReason}): tasks without skills are created without them`,
          );
        }
        return client;
      },
    },
  ],
  exports: [SkillIdentificationService],
})
export class SkillIdentificationModule {}
