import { OpenAiCompatibleClient } from '../../../src/features/skillIdentification/llm/openAiCompatibleClient.js';
import type { LlmJsonRequest } from '../../../src/features/skillIdentification/llm/llmClient.js';

const request: LlmJsonRequest = {
  systemPrompt: 'system',
  userPrompt: 'user',
  responseSchema: { type: 'object', additionalProperties: false },
};

function chatAnswer(content: string | null): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
  });
}

describe('OpenAiCompatibleClient', () => {
  const fetchFn = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('sends a chat completion that asks for JSON following the schema', async () => {
    const client = new OpenAiCompatibleClient({
      baseUrl: 'https://api.groq.com/openai/v1/',
      model: 'test-model',
      apiKey: 'test-key',
      timeoutMs: 1000,
      fetchFn,
    });
    fetchFn.mockResolvedValue(chatAnswer('{"tasks":[]}'));

    await expect(client.generateJson(request)).resolves.toEqual({ tasks: [] });

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer test-key');
    expect(JSON.parse(init.body)).toEqual({
      model: 'test-model',
      temperature: 0,
      messages: [
        { role: 'system', content: 'system' },
        { role: 'user', content: 'user' },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'skill_identification',
          strict: true,
          schema: request.responseSchema,
        },
      },
    });
  });

  it('sends no Authorization header when there is no key, as for a local Ollama', async () => {
    const client = new OpenAiCompatibleClient({
      baseUrl: 'http://localhost:11434/v1',
      model: 'qwen3:8b',
      timeoutMs: 1000,
      fetchFn,
    });
    fetchFn.mockResolvedValue(chatAnswer('{}'));

    await client.generateJson(request);

    expect(fetchFn.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('retries once when rate limited, then fails', async () => {
    const client = new OpenAiCompatibleClient({
      baseUrl: 'http://llm',
      model: 'm',
      timeoutMs: 1000,
      fetchFn,
    });
    fetchFn.mockResolvedValue(new Response('', { status: 429 }));

    await expect(client.generateJson(request)).rejects.toThrow('HTTP 429');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('fails when the model returns no content', async () => {
    const client = new OpenAiCompatibleClient({
      baseUrl: 'http://llm',
      model: 'm',
      timeoutMs: 1000,
      fetchFn,
    });
    fetchFn.mockResolvedValue(chatAnswer(null));

    await expect(client.generateJson(request)).rejects.toThrow('empty answer');
  });
});
