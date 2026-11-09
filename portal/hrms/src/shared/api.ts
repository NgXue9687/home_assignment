import type { Developer, PagedResponse, Skill, Task, TaskStatusCode } from "./constants";
import type { CreateTaskRequest } from "./taskDraft";
import { TASK_PAGE_SIZE } from "./constants";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
// The backend's UserActionGuard rejects requests without this header (max 20
// characters). It stands in for a logged-in user until real authentication exists.
const ACTING_USER = import.meta.env.VITE_ACTING_USER ?? "portal-user";

// An API call that failed. message is ready to show to the user.
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status; // 0 when the server could not be reached
  }
}

async function request<T>(
  path: string,
  options: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "x-acting-user": ACTING_USER,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// NestJS errors look like { statusCode, message, error }, where message is a
// string or, for validation errors, a list of strings.
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    if (typeof body.message === "string") return body.message;
    if (Array.isArray(body.message)) return body.message.join(". ");
  } catch {
    // not JSON: fall through
  }
  return `Request failed (HTTP ${response.status})`;
}

export const taskApi = {
  // Creates a task together with all its subtasks, in one request.
  create: (task: CreateTaskRequest) =>
    request<Task>("/tasks", { method: "POST", body: task }),

  list: (page = 1, pageSize = TASK_PAGE_SIZE) =>
    request<PagedResponse<Task>>(`/tasks?page=${page}&pageSize=${pageSize}`),

  changeStatus: (taskUuid: string, status: TaskStatusCode) =>
    request<Task>(`/tasks/${taskUuid}/status`, { method: "PUT", body: { status } }),

  // null removes the current assignee.
  assignDeveloper: (taskUuid: string, developerUuid: string | null) =>
    request<Task>(`/tasks/${taskUuid}/assignee`, {
      method: "PUT",
      body: { developerUuid },
    }),
};

export const developerApi = {
  list: () => request<Developer[]>("/developers"),
};

export const skillApi = {
  list: () => request<Skill[]>("/skills"),
};
