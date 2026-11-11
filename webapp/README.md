# HTX Task Assignment — Backend

NestJS (TypeScript) API for tasks, subtasks, developers and skills, with LLM-based skill identification. For the whole application (setup, system design, full API reference) see the [main README](../README.md).

## Setup

Requires Node.js 22+ and the PostgreSQL database from the repository's `docker-compose.yml`.

```bash
cp .env.example .env    # set DB_PASSWORD and LLM_API_KEY
npm install
npm run start:dev       # http://localhost:3000
```

All settings are listed in the [main README](../README.md#configuration). They are validated at startup (`src/shared/config/envValidation.ts`).

In development, a browser-based API tester is served at http://localhost:3000/apiTester.html (`tools/apiTester.html`).

## Scripts

| Command | What it does |
|---|---|
| `npm run start:dev` | Run with reload on change |
| `npm run build` / `npm run start:prod` | Compile to `dist/` and run the compiled build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests |
| `npm run test:cov` | Tests with coverage |
| `npm run lint` | oxlint with type-aware rules |
| `npm run format` | Prettier |

## Project structure

```
src/
├── main.ts                    # bootstrap: validation pipe, error filter, API tester (dev)
├── app.module.ts              # config + TypeORM + feature modules
├── features/
│   ├── tasks/                 # create (with subtasks), list, read, update, status, assignee, delete
│   ├── developers/            # read
│   ├── skills/                # read
│   ├── sysconfig/             # settings from the sysconfig table (GET /sysconfigs)
│   └── skillIdentification/   # LLM skill identification (see below)
│       └── llm/               # provider clients: Gemini, OpenAI-compatible
├── models/
│   ├── entity/                # TypeORM entities (one per table)
│   └── dto/                   # request, query and response shapes
└── shared/
    ├── auth/                  # UserActionGuard (x-acting-user header)
    ├── config/                # environment validation
    ├── constants/             # statuses, messages, sysconfig keys, LLM defaults
    ├── filters/               # QueryFailedFilter: database errors → 409 / 422
    └── utils/                 # pure helpers (subtask rules, skill matching, LLM prompt)
test/                          # mirrors src/
```

## Conventions

- **ESM project.** Relative imports end in `.js`; tests use Vitest (`vi.fn()`).
- **Every controller is guarded** by `UserActionGuard`, which requires an `x-acting-user` header and records it as `createdby` / `modifiedby`. It is a stand-in for real authentication.
- **Requests are validated** against DTOs by a global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`, so unknown fields are rejected.
- **Responses never expose numeric IDs.** Entities are mapped to response DTOs that use `uuid`.
- **User-facing messages** live in `shared/constants/sysMessages.ts`.
- **Business rules** (skills for assignment, Done only when subtasks are Done, nesting depth, no deleting tasks with subtasks) are in `TasksService`, inside transactions where several rows change together.

## Skill identification using an LLM (Part 5)

When a task or subtask is created **without** `skillUuids`, the backend asks an LLM which skills it needs, based on its title, and saves them. Nothing has to be triggered from the frontend.

### Setup

The LLM provider is chosen in `.env`. Gemini is the default:

```
LLM_PROVIDER=gemini
LLM_API_KEY=your-key          # free key at https://aistudio.google.com/apikey
LLM_MODEL=                    # optional, defaults to gemini-3.5-flash-lite
LLM_TIMEOUT_MS=15000          # optional, per attempt
```

Any provider that speaks the OpenAI Chat Completions API works too: OpenAI, Groq, OpenRouter, Mistral, Cerebras, or a local Ollama.

| Provider | `LLM_PROVIDER` | `LLM_BASE_URL` | `LLM_MODEL` (example) | Key |
|---|---|---|---|---|
| Gemini (default) | `gemini` | | `gemini-3.5-flash-lite` | Required |
| Groq | `openai-compatible` | `https://api.groq.com/openai/v1` | `openai/gpt-oss-120b` | Required |
| OpenAI | `openai-compatible` | `https://api.openai.com/v1` | `gpt-5-mini` | Required |
| Ollama (local, no account) | `openai-compatible` | `http://localhost:11434/v1` | `qwen3:8b` | Not needed |

For `openai-compatible`, pick a model that supports structured outputs (`response_format` with `json_schema`).

If the chosen provider isn't fully configured, or `LLM_PROVIDER=none`, the app still starts and logs why skill identification is off. Tasks can then only be created with skills chosen by the user. An unknown `LLM_PROVIDER` value stops the app at startup.

### How it works

```
POST /tasks ─► TasksService.create
                 ├─ SkillIdentificationService.identifyForTaskTree(dto)
                 │    ├─ collect the task + subtasks sent without skillUuids
                 │    ├─ load active skills from the skills table
                 │    ├─ one LLM call for all those titles (JSON schema output)
                 │    └─ keep only skill names that exist in the table
                 └─ transaction: save tasks + taskskillsmapper rows
```

| File | Role |
|---|---|
| `src/features/skillIdentification/skillIdentification.service.ts` | Decides which tasks need skills, calls the LLM, checks the answer |
| `src/features/skillIdentification/llm/llmClient.ts` | Provider-neutral `LlmClient` interface and JSON Schema type |
| `src/features/skillIdentification/llm/llmClientFactory.ts` | Picks the client from the `LLM_*` settings |
| `src/features/skillIdentification/llm/geminiClient.ts` | Gemini REST API |
| `src/features/skillIdentification/llm/openAiCompatibleClient.ts` | OpenAI Chat Completions API (OpenAI, Groq, Ollama…) |
| `src/features/skillIdentification/llm/llmHttp.ts` | Shared HTTP: timeout on every attempt, one retry on 429/5xx |
| `src/shared/utils/skillIdentification.prompt.ts` | Prompt, response schema, and reading the answer (pure functions) |

### Design decisions

- **The provider is configuration, not code.** The service depends only on the `LlmClient` interface. The response schema is written once as standard JSON Schema, and each client converts it to its provider's format. Adding another kind of provider means writing one class.
- **Skills come from the database, not the code.** The prompt lists the active skills with their descriptions, and the response schema limits the answer to those names (`enum`). Adding a skill row makes it available to the LLM with no code change.
- **The LLM's answer is never trusted as-is.** Names are matched against the skills table (ignoring case), and anything unknown, malformed or for a task that wasn't asked about is dropped. The schema and this check also limit what a prompt-injection attempt in a task title could achieve: at most, a wrong choice among real skills.
- **One LLM call per request.** A task and all its subtasks are classified in a single call, which keeps latency low and stays inside free-tier rate limits.
- **No task is saved without skills (fail closed).** If the provider is down, slow (timeout), rate limited after one retry, or leaves any task or subtask without a skill, the whole request is rejected with `503` and the message *"Failed to save the task, please try again"*. Nothing is saved, and the real reason is logged. A task without skills could be assigned to any developer, which would get around the rule that a task only goes to a developer with its skills. The user can retry, or choose the skills themselves to skip the LLM.
- **The LLM is called before the database transaction**, so no transaction is held open while waiting on a network call.
- **Audit trail.** Skills the LLM identified are saved with `createdby = 'System'`, so they can be told apart from skills a user chose.
- **Deterministic.** `temperature: 0`, plus the three examples from the requirements as few-shot examples in the prompt.

### Limitations and next steps

- Identification runs only at creation. Editing a task's title does not re-identify its skills.
- Creating a task waits for the LLM (bounded by `LLM_TIMEOUT_MS`). At higher volume this could move to a background job (for example `@nestjs/bullmq`) that fills in skills after the task is saved.
- There is no automatic failover between providers. A second provider could be tried when the first fails.
- Accuracy could be tracked with a small labelled set of task titles run against the prompt whenever it changes.

### Tests

`npm test` covers the service (subtasks, unknown names, malformed answers, and refusing to save when the LLM fails, leaves a task without skills, or isn't configured), both clients (request format, retry, no retry on 400, empty answer, no key for Ollama, timeout and connection-error messages), provider selection, and task creation (identified skills saved as `System`, user-chosen skills kept, nothing saved when identification fails). The LLM is mocked in all of them, so no API key is needed.
