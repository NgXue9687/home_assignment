import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillEntity } from '../../models/entity/skill.entity.js';
import { LlmDefaults } from '../../shared/constants/llmConfig.js';
import { SkillIdentificationService } from './skillIdentification.service.js';
import { LLM_CLIENT, type LlmClient } from './llm/llmClient.js';
import { GeminiClient } from './llm/geminiClient.js';

@Module({
  imports: [TypeOrmModule.forFeature([SkillEntity])],
  providers: [
    SkillIdentificationService,
    {
      provide: LLM_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): LlmClient | null => {
        const apiKey = configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
          new Logger(SkillIdentificationModule.name).warn(
            'GEMINI_API_KEY is not set: new tasks without skills will not have their skills identified',
          );
          return null;
        }
        return new GeminiClient({
          apiKey,
          model:
            configService.get<string>('GEMINI_MODEL') ||
            LlmDefaults.GEMINI_MODEL,
          timeoutMs:
            configService.get<number>('LLM_TIMEOUT_MS') ??
            LlmDefaults.TIMEOUT_MS,
        });
      },
    },
  ],
  exports: [SkillIdentificationService],
})
export class SkillIdentificationModule {}
