// Names of the keys of sysconfig in the table.
export const SysConfigKey = {
  MAX_SUBTASK_LIST_SIZE: 'MAX_SUBTASK_LIST_SIZE',
} as const;

export type SysConfigKey = (typeof SysConfigKey)[keyof typeof SysConfigKey];
