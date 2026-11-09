export const RecordStatus = { ACTIVE: 'A', INACTIVE: 'I' } as const;
export type RecordStatus = (typeof RecordStatus)[keyof typeof RecordStatus];
export const RECORD_STATUSES = Object.values(RecordStatus);
