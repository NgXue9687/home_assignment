import { Logger } from '@nestjs/common';
import type { LlmClient, LlmJsonRequest } from './llmClient.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
// Rate limited or a temporary server error: worth one more try.
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAY_MS = 500;

export interface GeminiClientOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxAttempts?: number;
  fetchFn?: typeof fetch; // replaced in tests
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

// Calls the Gemini REST API directly (no SDK), asking for a JSON answer that
// follows the given schema.
export class GeminiClient implements LlmClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly fetchFn: typeof fetch;
  private readonly maxAttempts: number;

  constructor(private readonly options: GeminiClientOptions) {
    this.fetchFn = options.fetchFn ?? fetch;
    this.maxAttempts = options.maxAttempts ?? 2;
  }

  async generateJson(request: LlmJsonRequest): Promise<unknown> {
    const url = `${GEMINI_BASE_URL}/models/${encodeURIComponent(this.options.model)}:generateContent`;
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: request.systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: request.userPrompt }] }],
      generationConfig: {
        temperature: 0, // same title, same answer
        responseMimeType: 'application/json',
        responseSchema: request.responseSchema,
      },
    });

    for (let attempt = 1; ; attempt++) {
      const response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.options.apiKey,
        },
        body,
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
      if (response.ok) {
        return parseAnswer((await response.json()) as GeminiResponse);
      }
      if (
        attempt >= this.maxAttempts ||
        !RETRYABLE_STATUSES.has(response.status)
      ) {
        throw new Error(`Gemini request failed with HTTP ${response.status}`);
      }
      this.logger.warn(
        `Gemini returned HTTP ${response.status}, retrying (attempt ${attempt + 1} of ${this.maxAttempts})`,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY_MS * attempt),
      );
    }
  }
}

function parseAnswer(response: GeminiResponse): unknown {
  const text = response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('');
  if (!text) throw new Error('Gemini returned an empty answer');
  return JSON.parse(text);
}
