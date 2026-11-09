// Constants and types for the Task pages, matching what the NestJS API returns.

// ---- Task status ----------------------------------------------------------

// Codes stored in tasks.status (same as the backend's TaskStatus).
export const TASK_STATUS = {
  TODO: "T",
  IN_PROGRESS: "P",
  DONE: "D",
} as const;

export type TaskStatusCode = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_STATUS_LABELS: Record<TaskStatusCode, string> = {
  T: "To Do",
  P: "In Progress",
  D: "Done",
};

// Order used when sorting by status: To Do -> In Progress -> Done (not alphabetical).
export const TASK_STATUS_ORDER: Record<TaskStatusCode, number> = {
  T: 0,
  P: 1,
  D: 2,
};

// ---- API data -------------------------------------------------------------

// One task as returned by GET /tasks.
export interface Task {
  uuid: string; // use as the React key; the numeric taskid is never sent
  taskTitle: string;
  taskDescription: string | null; // for the task details view
  status: TaskStatusCode;
  version: number;
  parentUuid: string | null; // set when this task is a subtask
  skills: { uuid: string; skillName: string }[];
  assignedDeveloper: { uuid: string; name: string } | null;
}

// One developer as returned by GET /developers.
export interface Developer {
  uuid: string;
  name: string;
  email: string | null;
  division: string | null;
  designation: string | null;
  status: string; // "A" active, "I" inactive
  skills: { uuid: string; skillName: string }[];
}

export const DEVELOPER_ACTIVE_STATUS = "A";

// Shape of GET /tasks (the backend returns tasks one page at a time).
export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---- Task table columns ---------------------------------------------------

export type SortOrder = "asc" | "desc";

export type TaskColumnId = "taskTitle" | "skills" | "status" | "assignedDeveloper";

export interface TaskColumn {
  id: TaskColumnId;
  label: string;
  // The value the column sorts by. Return null for "no value" (e.g. no
  // developer assigned); those rows always go last, whichever the direction.
  sortValue: (task: Task) => string | number | null;
}

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
];

export const DEFAULT_TASK_SORT: { orderBy: TaskColumnId; order: SortOrder } = {
  orderBy: "taskTitle",
  order: "asc",
};

// MUI Chip colour for each status.
export const TASK_STATUS_COLORS: Record<TaskStatusCode, "default" | "info" | "success"> = {
  T: "default",
  P: "info",
  D: "success",
};

// GET /tasks returns at most this many tasks per page (the backend's limit).
export const TASK_PAGE_SIZE = 100;

// ---- Task creation --------------------------------------------------------

// One skill as returned by GET /skills.
export interface Skill {
  uuid: string;
  skillName: string;
  skillDescription: string;
  status: string; // "A" active, "I" inactive
}

export const SKILL_ACTIVE_STATUS = "A";

// Same limits the backend checks (CreateTaskDto and the MAX_SUBTASK_LIST_SIZE sysconfig).
export const TASK_TITLE_MAX_LENGTH = 255;
export const TASK_DESCRIPTION_MAX_LENGTH = 5000;
export const MAX_SUBTASK_DEPTH = 3; // levels of subtasks below the main task

