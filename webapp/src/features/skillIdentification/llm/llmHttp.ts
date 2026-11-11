import { Logger } from '@nestjs/common';

// Rate limited or a temporary server error: worth one more try.
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAY_MS = 500;

export interface LlmHttpOptions {
  timeoutMs: number;
  maxAttempts?: number; // default 2: the first try and one retry
  fetchFn?: typeof fetch; // replaced in tests
}

// POSTs JSON to an LLM provider with a timeout on every attempt and one
// retry when the provider is rate limited or temporarily down.
export async function postJson(
  providerName: string,
  url: string,
  headers: Record<string, string>,
  body: unknown,
  options: LlmHttpOptions,
  logger: Logger,
): Promise<unknown> {
  const fetchFn = options.fetchFn ?? fetch;
  const maxAttempts = options.maxAttempts ?? 2;
  const payload = JSON.stringify(body);

  for (let attempt = 1; ; attempt++) {
    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: payload,
        signal: AbortSignal.timeout(options.timeoutMs),
      });
    } catch (error) {
      throw new Error(
        describeNetworkError(providerName, error, options.timeoutMs, startedAt),
      );
    }
    if (response.ok) return response.json();
    if (attempt >= maxAttempts || !RETRYABLE_STATUSES.has(response.status)) {
      throw new Error(
        `${providerName} request failed with HTTP ${response.status}`,
      );
    }
    logger.warn(
      `${providerName} returned HTTP ${response.status}, retrying (attempt ${attempt + 1} of ${maxAttempts})`,
    );
    await new Promise((resolve) =>
      setTimeout(resolve, RETRY_DELAY_MS * attempt),
    );
  }
}

// Parses the model's text answer as JSON, failing clearly when it is empty.
export function parseJsonText(
  providerName: string,
  text: string | null | undefined,
): unknown {
  if (!text) throw new Error(`${providerName} returned an empty answer`);
  return JSON.parse(text);
}

// Turns fetch's generic errors into a message that says what went wrong:
// no answer within the time limit, or the provider could not be reached at all.
function describeNetworkError(
  providerName: string,
  error: unknown,
  timeoutMs: number,
  startedAt: number,
): string {
  const elapsedMs = Date.now() - startedAt;
  if (error instanceof Error && error.name === 'TimeoutError') {
    return `${providerName} did not answer within ${timeoutMs} ms (LLM_TIMEOUT_MS)`;
  }
  // Node's fetch reports connection problems as "fetch failed" with the reason in `cause`.
  const cause = (error as { cause?: { code?: string; message?: string } })
    ?.cause;
  const reason =
    cause?.code ?? cause?.message ?? (error as Error)?.message ?? String(error);
  return `Could not reach ${providerName} (${reason}) after ${elapsedMs} ms`;
}
