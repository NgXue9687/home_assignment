import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';
import { LLM_PROVIDERS } from '../constants/llmConfig.js';

class EnvironmentVariables {
  @IsString() @IsNotEmpty() DB_HOST: string;
  @IsInt() @Min(1) @Max(65535) DB_PORT: number;
  @IsString() @IsNotEmpty() DB_USER: string;
  @IsString() @IsNotEmpty() DB_PASSWORD: string;
  @IsString() @IsNotEmpty() DB_NAME: string;
  @IsString() @IsNotEmpty() DB_SCHEMA: string;

  // LLM skill identification. All optional: if the chosen provider is not
  // fully configured, tasks are created without identified skills instead of
  // the app failing to start.
  @IsOptional()
  @IsIn(LLM_PROVIDERS, {
    message: `LLM_PROVIDER must be one of: ${LLM_PROVIDERS.join(', ')}`,
  })
  LLM_PROVIDER?: string;
  @IsOptional() @IsString() LLM_API_KEY?: string;
  @IsOptional() @IsString() LLM_MODEL?: string;
  @IsOptional() @IsString() LLM_BASE_URL?: string;
  @IsOptional() @IsInt() @Min(1000) @Max(60000) LLM_TIMEOUT_MS?: number;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
