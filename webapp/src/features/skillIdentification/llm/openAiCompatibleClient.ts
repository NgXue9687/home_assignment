import { Logger } from '@nestjs/common';
import type { LlmClient, LlmJsonRequest } from './llmClient.js';
import { type LlmHttpOptions, parseJsonText, postJson } from './llmHttp.js';

export interface OpenAiCompatibleClientOptions extends LlmHttpOptions {
  baseUrl: string; // e.g. https://api.groq.com/openai/v1 or http://localhost:11434/v1
  model: string;
  apiKey?: string; // not needed for a local Ollama
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string | null } }[];
}

// Any provider that speaks the OpenAI Chat Completions API: OpenAI, Groq,
// OpenRouter, Mistral, Cerebras, a local Ollama, and others.
// The model must support structured outputs (response_format json_schema).
export class OpenAiCompatibleClient implements LlmClient {
  private readonly logger = new Logger(OpenAiCompatibleClient.name);

  constructor(private readonly options: OpenAiCompatibleClientOptions) {}

  async generateJson(request: LlmJsonRequest): Promise<unknown> {
    const response = (await postJson(
      'LLM',
      `${this.options.baseUrl.replace(/\/+$/, '')}/chat/completions`,
      this.options.apiKey
        ? { Authorization: `Bearer ${this.options.apiKey}` }
        : {},
      {
        model: this.options.model,
        temperature: 0, // same title, same answer
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'skill_identification',
            strict: true,
            schema: request.responseSchema,
          },
        },
      },
      this.options,
      this.logger,
    )) as ChatCompletionResponse;
    return parseJsonText('LLM', response.choices?.[0]?.message?.content);
  }
}
