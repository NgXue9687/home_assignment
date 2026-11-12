// Fixed values used across the app. The data shapes (Task, Developer, Skill…)
// live in src/models.
import {
  TASK_STATUS,
  type SortOrder,
  type TaskColumn,
  type TaskColumnId,
  type TaskStatusCode,
} from "../models";

// ---- Record status --------------------------------------------------------

// Value of the status field on developers and skills (same as the backend's RecordStatus).
export const DEVELOPER_ACTIVE_STATUS = "A";
export const SKILL_ACTIVE_STATUS = "A";

// ---- Task status ----------------------------------------------------------

export const TASK_STATUS_LABELS: Record<TaskStatusCode, string> = {
  [TASK_STATUS.TODO]: "To Do",
  [TASK_STATUS.IN_PROGRESS]: "In Progress",
  [TASK_STATUS.DONE]: "Done",
};

// Order used when sorting by status: To Do -> In Progress -> Done (not alphabetical).
export const TASK_STATUS_ORDER: Record<TaskStatusCode, number> = {
  [TASK_STATUS.TODO]: 0,
  [TASK_STATUS.IN_PROGRESS]: 1,
  [TASK_STATUS.DONE]: 2,
};

// MUI Chip colour for each status.
export const TASK_STATUS_COLORS: Record<TaskStatusCode, "default" | "info" | "success"> = {
  [TASK_STATUS.TODO]: "default",
  [TASK_STATUS.IN_PROGRESS]: "info",
  [TASK_STATUS.DONE]: "success",
};

// ---- Task list table ------------------------------------------------------

export const TASK_COLUMNS: TaskColumn[] = [
  {
    id: "taskTitle",
    label: "Title",
    sortValue: (task) => task.taskTitle.toLowerCase(),
  },
  {
    id: "skills",
    label: "Skills",
    // e.g. "backend, frontend"; tasks without skills go last
    sortValue: (task) =>
      task.skills.length > 0
        ? task.skills.map((skill) => skill.skillName.toLowerCase()).sort().join(", ")
        : null,
  },
  {
    id: "status",
    label: "Status",
    sortValue: (task) => TASK_STATUS_ORDER[task.status],
  },
  {
    id: "assignedDeveloper",
    label: "Assignee",
    sortValue: (task) => task.assignedDeveloper?.name.toLowerCase() ?? null,
  },
  {
    id: "createdDate",
    label: "Created",
    sortValue: (task) => Date.parse(task.createdDate),
  },
];

export const DEFAULT_TASK_SORT: { orderBy: TaskColumnId; order: SortOrder } = {
  orderBy: "createdDate", // newest first
  order: "desc",
};

// ---- Limits (the same ones the backend checks) ----------------------------

// GET /tasks returns at most this many tasks per page.
export const TASK_PAGE_SIZE = 100;

// CreateTaskDto field lengths.
export const TASK_TITLE_MAX_LENGTH = 255;
export const TASK_DESCRIPTION_MAX_LENGTH = 5000;

// Levels of subtasks allowed below the main task. Default only: the real value
// comes from the MAX_SUBTASK_LIST_SIZE sysconfig.
// used until the sysconfig value has loaded, or if loading fails
export const MAX_SUBTASK_DEPTH = 3;
