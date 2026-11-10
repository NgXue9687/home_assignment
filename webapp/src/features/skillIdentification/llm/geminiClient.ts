import { Logger } from '@nestjs/common';
import type { JsonSchema, LlmClient, LlmJsonRequest } from './llmClient.js';
import { type LlmHttpOptions, parseJsonText, postJson } from './llmHttp.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiClientOptions extends LlmHttpOptions {
  apiKey: string;
  model: string;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

// Google Gemini, through its own REST API (no SDK).
export class GeminiClient implements LlmClient {
  private readonly logger = new Logger(GeminiClient.name);

  constructor(private readonly options: GeminiClientOptions) {}

  async generateJson(request: LlmJsonRequest): Promise<unknown> {
    const response = (await postJson(
      'Gemini',
      `${GEMINI_BASE_URL}/models/${encodeURIComponent(this.options.model)}:generateContent`,
      { 'x-goog-api-key': this.options.apiKey },
      {
        systemInstruction: { parts: [{ text: request.systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: request.userPrompt }] }],
        generationConfig: {
          temperature: 0, // same title, same answer
          responseMimeType: 'application/json',
          responseSchema: toGeminiSchema(request.responseSchema),
        },
      },
      this.options,
      this.logger,
    )) as GeminiResponse;
    const text = response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('');
    return parseJsonText('Gemini', text);
  }
}

// Gemini's responseSchema writes types in capitals and has no additionalProperties.
export function toGeminiSchema(schema: JsonSchema): Record<string, unknown> {
  const { type, properties, items, additionalProperties: _, ...rest } = schema;
  return {
    ...rest,
    type: type.toUpperCase(),
    ...(properties && {
      properties: Object.fromEntries(
        Object.entries(properties).map(([name, property]) => [
          name,
          toGeminiSchema(property),
        ]),
      ),
    }),
    ...(items && { items: toGeminiSchema(items) }),
  };
}
