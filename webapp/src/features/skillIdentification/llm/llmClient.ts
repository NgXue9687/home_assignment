// The contract every LLM provider implements, so Gemini can be swapped for
// another provider without touching the code that asks for skills.
export interface LlmJsonRequest {
  systemPrompt: string;
  userPrompt: string;
  // Schema the answer must follow (the OpenAPI subset that Gemini accepts).
  responseSchema: Record<string, unknown>;
}

export interface LlmClient {
  // Resolves to the parsed JSON answer. Rejects if the provider fails.
  generateJson(request: LlmJsonRequest): Promise<unknown>;
}

// Injection token. Its value is null when no API key is configured.
export const LLM_CLIENT = Symbol('LLM_CLIENT');
