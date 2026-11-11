import type { SkillSummary } from "./skill.model";

// Codes stored in tasks.status (same as the backend's TaskStatus).
export const TASK_STATUS = {
  TODO: "T",
  IN_PROGRESS: "P",
  DONE: "D",
} as const;

export type TaskStatusCode = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

// One task as returned by GET /tasks.
export interface Task {
  uuid: string; // use as the React key; the numeric taskid is never sent
  taskTitle: string;
  taskDescription: string | null; // for the task details view
  status: TaskStatusCode;
  version: number;
  parentUuid: string | null; // set when this task is a subtask
  skills: SkillSummary[];
  assignedDeveloper: { uuid: string; name: string } | null;
}
