import { GeminiClient } from '../../../src/features/skillIdentification/llm/geminiClient.js';

const request = {
  systemPrompt: 'system',
  userPrompt: 'user',
  responseSchema: { type: 'OBJECT' },
};

function geminiAnswer(text: string): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status: 200 },
  );
}

describe('GeminiClient', () => {
  const fetchFn = vi.fn();
  const client = new GeminiClient({
    apiKey: 'test-key',
    model: 'test-model',
    timeoutMs: 1000,
    fetchFn,
  });

  beforeEach(() => vi.clearAllMocks());

  it('asks for JSON that follows the schema and parses the answer', async () => {
    fetchFn.mockResolvedValue(geminiAnswer('{"tasks":[]}'));

    await expect(client.generateJson(request)).resolves.toEqual({ tasks: [] });

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent',
    );
    expect(init.headers['x-goog-api-key']).toBe('test-key');
    const body = JSON.parse(init.body);
    expect(body.generationConfig).toEqual({
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: { type: 'OBJECT' },
    });
    expect(body.systemInstruction.parts[0].text).toBe('system');
    expect(body.contents[0].parts[0].text).toBe('user');
  });

  it('retries once when rate limited', async () => {
    fetchFn
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(geminiAnswer('{"ok":true}'));

    await expect(client.generateJson(request)).resolves.toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('gives up after the last attempt', async () => {
    fetchFn.mockResolvedValue(new Response('', { status: 503 }));

    await expect(client.generateJson(request)).rejects.toThrow('HTTP 503');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('does not retry a request Gemini rejected', async () => {
    fetchFn.mockResolvedValue(new Response('', { status: 400 }));

    await expect(client.generateJson(request)).rejects.toThrow('HTTP 400');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('fails when the answer is empty', async () => {
    fetchFn.mockResolvedValue(
      new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
    );

    await expect(client.generateJson(request)).rejects.toThrow('empty answer');
  });
});
