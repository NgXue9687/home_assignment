import type { SortOrder, Task, TaskColumn } from "../models";

// Returns a sorted copy of the tasks by one column. Rows without a value
// (e.g. no assigned developer) always go last, whichever the direction.
export function sortTasks(
  tasks: Task[],
  column: TaskColumn,
  order: SortOrder,
): Task[] {
  const { sortValue } = column;
  if (!sortValue) return tasks;
  const direction = order === "asc" ? 1 : -1;
  return [...tasks].sort((a, b) => {
    const first = sortValue(a);
    const second = sortValue(b);
    if (first === second) return 0;
    if (first === null) return 1;
    if (second === null) return -1;
    return (first < second ? -1 : 1) * direction;
  });
}
