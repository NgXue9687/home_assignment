// Values for LLM_PROVIDER.
export const LlmProvider = {
  GEMINI: 'gemini',
  OPENAI_COMPATIBLE: 'openai-compatible',
  NONE: 'none',
} as const;

export type LlmProvider = (typeof LlmProvider)[keyof typeof LlmProvider];
export const LLM_PROVIDERS = Object.values(LlmProvider);

// Used when the matching environment variable is not set.
export const LlmDefaults = {
  PROVIDER: LlmProvider.GEMINI,
  GEMINI_MODEL: 'gemini-3.5-flash-lite',
  TIMEOUT_MS: 5000,
} as const;
