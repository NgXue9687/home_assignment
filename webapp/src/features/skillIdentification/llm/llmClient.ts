// The contract every LLM provider implements, so providers can be swapped
// through configuration without touching the code that asks for skills.
export interface LlmJsonRequest {
  systemPrompt: string;
  userPrompt: string;
  // Standard JSON Schema the answer must follow. Each client converts it to
  // its provider's format.
  responseSchema: JsonSchema;
}

export interface JsonSchema {
  type: 'object' | 'array' | 'string' | 'integer' | 'number' | 'boolean';
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: string[];
  additionalProperties?: boolean;
}

export interface LlmClient {
  // Resolves to the parsed JSON answer. Rejects if the provider fails.
  generateJson(request: LlmJsonRequest): Promise<unknown>;
}

// Injection token. Its value is null when the LLM is turned off or not configured.
export const LLM_CLIENT = Symbol('LLM_CLIENT');
