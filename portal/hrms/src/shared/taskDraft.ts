import { TASK_STATUS, type TaskStatusCode } from "../models";
import {
  MAX_SUBTASK_DEPTH,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} from "./constants";

// A task (or subtask) being filled in on the Create Task page. Subtasks have
// the same fields as a task and can have subtasks of their own.
export interface TaskDraft {
  key: string; // identifies the card on screen only; never sent to the API
  taskTitle: string;
  taskDescription: string;
  status: TaskStatusCode;
  skillUuids: string[];
  subtasks: TaskDraft[];
}

// The body of POST /tasks (the backend's CreateTaskDto).
export interface CreateTaskRequest {
  taskTitle: string;
  taskDescription?: string;
  status: TaskStatusCode;
  skillUuids?: string[]; // left out when empty, so the backend's LLM identifies them
  subtasks?: CreateTaskRequest[];
}

export interface DraftErrors {
  taskTitle?: string;
  taskDescription?: string;
  status?: string;
}

export function newTaskDraft(): TaskDraft {
  return {
    key: crypto.randomUUID(),
    taskTitle: "",
    taskDescription: "",
    status: TASK_STATUS.TODO,
    skillUuids: [],
    subtasks: [],
  };
}

// ---- Changing the tree (each returns a new tree; the old one is untouched) --

export function updateDraft(
  draft: TaskDraft,
  key: string,
  changes: Partial<Omit<TaskDraft, "key" | "subtasks">>,
): TaskDraft {
  if (draft.key === key) return { ...draft, ...changes };
  return { ...draft, subtasks: draft.subtasks.map((subtask) => updateDraft(subtask, key, changes)) };
}

export function addSubtask(draft: TaskDraft, parentKey: string): TaskDraft {
  if (draft.key === parentKey) return { ...draft, subtasks: [...draft.subtasks, newTaskDraft()] };
  return { ...draft, subtasks: draft.subtasks.map((subtask) => addSubtask(subtask, parentKey)) };
}

// Removes a subtask together with everything under it.
export function removeDraft(draft: TaskDraft, key: string): TaskDraft {
  return {
    ...draft,
    subtasks: draft.subtasks
      .filter((subtask) => subtask.key !== key)
      .map((subtask) => removeDraft(subtask, key)),
  };
}

export function countDrafts(draft: TaskDraft): number {
  return 1 + draft.subtasks.reduce((total, subtask) => total + countDrafts(subtask), 0);
}

// ---- Checking before saving (the same rules the backend enforces) ----------

// Errors per card key. An empty map means the tree can be saved.
export function validateDraftTree(root: TaskDraft): Map<string, DraftErrors> {
  const errors = new Map<string, DraftErrors>();
  const visit = (draft: TaskDraft, depth: number) => {
    const found: DraftErrors = {};
    const title = draft.taskTitle.trim();
    if (!title) found.taskTitle = "Title is required";
    else if (title.length > TASK_TITLE_MAX_LENGTH)
      found.taskTitle = `Title must be at most ${TASK_TITLE_MAX_LENGTH} characters`;
    if (draft.taskDescription.trim().length > TASK_DESCRIPTION_MAX_LENGTH)
      found.taskDescription = `Description must be at most ${TASK_DESCRIPTION_MAX_LENGTH} characters`;
    if (
      draft.status === TASK_STATUS.DONE &&
      draft.subtasks.some((subtask) => subtask.status !== TASK_STATUS.DONE)
    )
      found.status = "Can only be Done when all its subtasks are Done";
    if (depth > MAX_SUBTASK_DEPTH) found.taskTitle = "Subtasks are nested too deeply";
    if (Object.keys(found).length > 0) errors.set(draft.key, found);
    draft.subtasks.forEach((subtask) => visit(subtask, depth + 1));
  };
  visit(root, 0);
  return errors;
}

// Turns the form into the POST /tasks body: trims text and leaves out empty fields.
export function toCreateTaskRequest(draft: TaskDraft): CreateTaskRequest {
  const description = draft.taskDescription.trim();
  return {
    taskTitle: draft.taskTitle.trim(),
    ...(description && { taskDescription: description }),
    status: draft.status,
    ...(draft.skillUuids.length > 0 && { skillUuids: draft.skillUuids }),
    ...(draft.subtasks.length > 0 && { subtasks: draft.subtasks.map(toCreateTaskRequest) }),
  };
}
