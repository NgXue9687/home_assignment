import { TaskStatus } from '../../shared/constants/taskStatus.js';

// A task can only be Done when every one of its subtasks is Done (brief 4.2).
export function hasUnfinishedSubtasks(subtaskStatuses: string[]): boolean {
  return subtaskStatuses.some((status) => status !== TaskStatus.DONE);
}

type SubtaskTree = { subtasks?: SubtaskTree[] };

// How many levels of subtasks sit below a task: 0 for none, 1 for subtasks only,
// 2 when a subtask has subtasks of its own, and so on.
export function getSubtaskDepth(task: SubtaskTree): number {
  return Math.max(
    0,
    ...(task.subtasks ?? []).map((subtask) => 1 + getSubtaskDepth(subtask)),
  );
}
