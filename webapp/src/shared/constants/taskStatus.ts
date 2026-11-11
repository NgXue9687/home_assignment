// Set of Task Status
export const TaskStatus = {
  TODO: 'T',
  IN_PROGRESS: 'P',
  DONE: 'D',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export const TASK_STATUSES = Object.values(TaskStatus);
