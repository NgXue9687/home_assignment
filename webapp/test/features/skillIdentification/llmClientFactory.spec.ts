import { createLlmClient } from '../../../src/features/skillIdentification/llm/llmClientFactory.js';
import { GeminiClient } from '../../../src/features/skillIdentification/llm/geminiClient.js';
import { OpenAiCompatibleClient } from '../../../src/features/skillIdentification/llm/openAiCompatibleClient.js';

describe('createLlmClient', () => {
  it('uses Gemini by default when a key is set', () => {
    expect(createLlmClient({ apiKey: 'key' }).client).toBeInstanceOf(
      GeminiClient,
    );
  });

  it('turns skill identification off when Gemini has no key', () => {
    expect(createLlmClient({ provider: 'gemini' })).toEqual({
      client: null,
      disabledReason: 'LLM_API_KEY is not set',
    });
  });

  it('uses an OpenAI-compatible provider when it has a base URL and a model', () => {
    const { client } = createLlmClient({
      provider: 'openai-compatible',
      baseUrl: 'http://localhost:11434/v1',
      model: 'qwen3:8b',
    });
    expect(client).toBeInstanceOf(OpenAiCompatibleClient);
  });

  it('turns skill identification off when an OpenAI-compatible provider has no model', () => {
    const { client, disabledReason } = createLlmClient({
      provider: 'openai-compatible',
      baseUrl: 'http://localhost:11434/v1',
    });
    expect(client).toBeNull();
    expect(disabledReason).toContain('LLM_MODEL');
  });

  it('turns skill identification off when the provider is none', () => {
    expect(
      createLlmClient({ provider: 'none', apiKey: 'key' }).client,
    ).toBeNull();
  });
});
