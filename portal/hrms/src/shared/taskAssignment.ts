import type { Developer, Task } from "../models";
import { DEVELOPER_ACTIVE_STATUS } from "./constants";

// Active developers who have every skill the task needs. The backend rejects
// anyone else, so only these are offered. A task without skills can go to anyone.
export function eligibleDevelopers(task: Task, developers: Developer[]): Developer[] {
  return developers.filter(
    (developer) =>
      developer.status === DEVELOPER_ACTIVE_STATUS &&
      task.skills.every((required) =>
        developer.skills.some((skill) => skill.uuid === required.uuid),
      ),
  );
}
