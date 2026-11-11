export const SysMessage = {
  SYSCONFIG_GENRAL_ERROR: 'Error occurred when retrieving Sysconfig',
  PARENT_TASK_DONE:
    'Reopen the parent task before moving this subtask out of Done',
  SUBTASKS_NOT_DONE: 'A task can only be Done when all its subtasks are Done',
  TASK_HAS_SUBTASKS: 'Delete the subtasks of this task first',
  SKILLS_NOT_FOUND: 'One or more skillUuids do not exist',
  // Shown when the LLM could not identify skills; the real reason is only logged.
  TASK_SAVE_FAILED: 'Failed to save the task, please try again',
} as const;

export type SysMessage = (typeof SysMessage)[keyof typeof SysMessage];
export const SYS_MESSAGES = Object.values(SysMessage);

// Messages that include a value from the request.
export const SysMessageFormat = {
  taskNotFound: (uuid: string) => `Task ${uuid} not found`,
  developerNotFound: (uuid: string) => `Developer ${uuid} not found`,
  skillNotFound: (uuid: string) => `Skill ${uuid} not found`,
  developerLacksSkills: (developerName: string, taskUuid: string) =>
    `${developerName} lacks skills required by task ${taskUuid}`,
  subtaskDepthExceeded: (maxDepth: number) =>
    `Subtasks can be nested at most ${maxDepth} levels deep`,
  actingUserRequired: (headerName: string, maxLength: number) =>
    `Header ${headerName} is required (max ${maxLength} characters)`,
} as const;
