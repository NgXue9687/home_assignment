# HTX Task Assignment — Frontend

React + TypeScript single-page application for listing, creating and assigning tasks. For the whole application (setup, system design, API) see the [main README](../../README.md).

## Setup

Requires Node.js 22+ and the backend running on port 3000.

```bash
npm install
npm run dev     # http://localhost:4000
```

In development, Vite forwards every `/api/*` request to `http://localhost:3000` (see `vite.config.ts`), so the browser only talks to one origin and the backend needs no CORS setup.

Optional settings go in `.env` (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Where API calls go |
| `VITE_ACTING_USER` | `portal-user` | Sent as the `x-acting-user` header the backend requires (max 20 characters) |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload (port 4000) |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |

## Pages

| URL | Page | What it does |
|---|---|---|
| `/tasks` | Task List | All tasks and subtasks, sortable by every column. Status and assignee are changed inline and saved immediately; only developers with all the task's skills are offered. Delete asks for confirmation and is disabled while a task has subtasks. |
| `/tasks/create` | Create Task(s) | A form for the task and any number of nested subtasks. Each card has title, description, status and skills; leaving skills empty lets the backend identify them with the LLM. |
| anything else | | Redirects to `/tasks` |

Every change shows a toast and is recorded in the **activity log** (bottom-right button), which keeps the session's history.

## How the Create page handles nesting

Each task card is the same component, `TaskFormCard`. It renders its own fields, then renders a `TaskFormCard` for each of its subtasks, one level further in, so any depth is drawn with one component (brief 4.3). The form's data is a tree (`TaskDraft`, with `subtasks: TaskDraft[]`); helpers in `shared/taskDraft.ts` add, update and remove nodes without changing the old tree, validate it with the same rules as the backend, and convert it to the `POST /tasks` body. The whole tree is saved in one request.

The maximum depth comes from the backend's `MAX_SUBTASK_LIST_SIZE` setting, loaded once at start-up into the Redux store; *Add Subtask* is disabled at the limit.

## Project structure

```
src/
├── main.tsx            # Redux Provider + router
├── routes.tsx          # /tasks, /tasks/create, redirect
├── layouts/            # MainLayout: header, notifications, loads settings
├── pages/              # taskListingPage, taskCreatePage
├── components/         # taskFormCard (recursive), status/assignee selects,
│                       # confirmDialog, activityLog, header
├── models/             # data shapes from the API (Task, Developer, Skill…)
├── shared/
│   ├── api.ts          # API client: x-acting-user header, readable errors
│   ├── constants.ts    # labels, colours, table columns, limits
│   ├── notifications/  # toast + activity log (useNotify)
│   ├── taskDraft.ts    # Create-page form tree: helpers, validation, request
│   ├── taskSort.ts     # table sorting
│   └── taskAssignment.ts  # which developers can take a task
└── store/              # Redux store: settings from GET /sysconfigs
```

## Libraries

| Library | Why |
|---|---|
| React + TypeScript | Required by the brief |
| Vite | Fast dev server and build; its proxy removes the need for CORS |
| React Router | Client-side routing for the single-page application |
| MUI + Emotion | Accessible ready-made components: sortable tables, selects, dialogs, toasts |
| Redux Toolkit + React Redux | Settings loaded once and shared by every page |
