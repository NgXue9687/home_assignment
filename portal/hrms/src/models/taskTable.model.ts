import type { Task } from "./task.model";

export type SortOrder = "asc" | "desc";

export type TaskColumnId = "taskTitle" | "skills" | "status" | "assignedDeveloper";

// One column of the task list table.
export interface TaskColumn {
  id: TaskColumnId;
  label: string;
  // The value the column sorts by. Return null for "no value" (e.g. no
  // developer assigned); those rows always go last, whichever the direction.
  sortValue: (task: Task) => string | number | null;
}
