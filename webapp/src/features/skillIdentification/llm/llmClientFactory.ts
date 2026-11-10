import {
  LlmDefaults,
  LlmProvider,
} from '../../../shared/constants/llmConfig.js';
import type { LlmClient } from './llmClient.js';
import { GeminiClient } from './geminiClient.js';
import { OpenAiCompatibleClient } from './openAiCompatibleClient.js';

export interface LlmSettings {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface LlmClientChoice {
  client: LlmClient | null;
  // Why the client is null, to log at startup.
  disabledReason?: string;
}

// Picks the LLM client from the LLM_* environment variables. When the chosen
// provider is not fully configured, skill identification is turned off
// (with the reason) instead of the app failing to start.
export function createLlmClient(settings: LlmSettings): LlmClientChoice {
  const provider = settings.provider || LlmDefaults.PROVIDER;
  const timeoutMs = settings.timeoutMs ?? LlmDefaults.TIMEOUT_MS;

  switch (provider) {
    case LlmProvider.NONE:
      return { client: null, disabledReason: 'LLM_PROVIDER is none' };

    case LlmProvider.GEMINI:
      if (!settings.apiKey) {
        return { client: null, disabledReason: 'LLM_API_KEY is not set' };
      }
      return {
        client: new GeminiClient({
          apiKey: settings.apiKey,
          model: settings.model || LlmDefaults.GEMINI_MODEL,
          timeoutMs,
        }),
      };

    case LlmProvider.OPENAI_COMPATIBLE:
      if (!settings.baseUrl || !settings.model) {
        return {
          client: null,
          disabledReason:
            'LLM_BASE_URL and LLM_MODEL are needed for LLM_PROVIDER openai-compatible',
        };
      }
      return {
        client: new OpenAiCompatibleClient({
          baseUrl: settings.baseUrl,
          model: settings.model,
          apiKey: settings.apiKey || undefined,
          timeoutMs,
        }),
      };

    default:
      return {
        client: null,
        disabledReason: `LLM_PROVIDER "${provider}" is not supported`,
      };
  }
}
