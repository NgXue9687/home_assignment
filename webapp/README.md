<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Skill identification using an LLM (Part 5)

When a task or subtask is created **without** `skillUuids`, the backend asks an LLM (Google Gemini) which skills it needs, based on its title, and saves them. Nothing has to be triggered from the frontend.

### Setup

Add a Gemini API key to `.env` (free key at https://aistudio.google.com/apikey):

```
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-3.5-flash-lite   # optional
LLM_TIMEOUT_MS=5000                  # optional
```

Without a key the app still starts. It logs a warning and creates tasks without identified skills.

### How it works

```
POST /tasks ─► TasksService.create
                 ├─ SkillIdentificationService.identifyForTaskTree(dto)
                 │    ├─ collect the task + subtasks sent without skillUuids
                 │    ├─ load active skills from the skills table
                 │    ├─ one Gemini call for all those titles (JSON schema output)
                 │    └─ keep only skill names that exist in the table
                 └─ transaction: save tasks + taskskillsmapper rows
```

| File | Role |
|---|---|
| `src/features/skillIdentification/skillIdentification.service.ts` | Decides which tasks need skills, calls the LLM, checks the answer |
| `src/features/skillIdentification/llm/llmClient.ts` | Provider-neutral `LlmClient` interface |
| `src/features/skillIdentification/llm/geminiClient.ts` | Gemini REST implementation: timeout and one retry on 429/5xx |
| `src/shared/utils/skillIdentification.prompt.ts` | Prompt, response schema, and reading the answer (pure functions) |

### Design decisions

- **Skills come from the database, not the code.** The prompt lists the active skills with their descriptions, and the response schema limits the answer to those names (`enum`). Adding a skill row makes it available to the LLM with no code change.
- **The LLM's answer is never trusted as-is.** Names are matched against the skills table (ignoring case), and anything unknown, malformed or for a task that wasn't asked about is dropped. The schema and this check also limit what a prompt-injection attempt in a task title could achieve: at most, a wrong choice among real skills.
- **One LLM call per request.** A task and all its subtasks are classified in a single call, which keeps latency low and stays inside free-tier rate limits.
- **Creating a task never fails because of the LLM.** If Gemini is down, slow (timeout), rate limited after one retry, or returns nothing usable, the task is still created, just without identified skills, and a warning is logged.
- **The LLM is called before the database transaction**, so no transaction is held open while waiting on a network call.
- **Audit trail.** Skills the LLM identified are saved with `createdby = 'System'`, so they can be told apart from skills a user chose.
- **Deterministic.** `temperature: 0`, plus the three examples from the requirements as few-shot examples in the prompt.
- **Provider-neutral.** Switching to another LLM means writing one class that implements `LlmClient`.

### Limitations and next steps

- Identification runs only at creation. Editing a task's title does not re-identify its skills.
- Creating a task waits for the LLM (bounded by `LLM_TIMEOUT_MS`). At higher volume this could move to a background job (for example `@nestjs/bullmq`) that fills in skills after the task is saved.
- Accuracy could be tracked with a small labelled set of task titles run against the prompt whenever it changes.

### Tests

`npm test` covers the service (subtasks, unknown names, malformed answers, LLM failure, no key), the Gemini client (request format, retry, no retry on 400, empty answer) and task creation (identified skills saved as `System`, user-chosen skills kept). The LLM is mocked in all of them, so no API key is needed.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

To add it to this project, run this and approve the code it prints at [observe.nestjs.com/link](https://observe.nestjs.com/link) - signing up for free if you have no account:

```bash
$ npx @nestjs/observe link
```

It installs `@nestjs/observe`, wires it into `AppModule` and `main.ts`, and writes the app key and secret into `.env`, which every `nest start` script (`start`, `start:dev`, `start:debug`) then loads. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead.

Or do it by hand:

```bash
$ npm install @nestjs/observe
```

Then follow the [setup guide](https://docs.nestjs.com/observability/sdk) - it takes a single import and an app key.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
