import { TaskEntity } from '../../entity/task.entity.js';

export type TaskResponseDto = {
  uuid: string;
  taskTitle: string;
  taskDescription: string | null;
  status: string;
  version: number;
  parentUuid: string | null;
  skills: { uuid: string; skillName: string }[];
  assignedDeveloper: { uuid: string; name: string } | null;
  createdDate: Date; // sent as an ISO date string
  modifiedDate: Date;
};

export function toTaskResponse(task: TaskEntity): TaskResponseDto {
  const assignment = task.taskMappers?.[0];
  return {
    uuid: task.uuid,
    taskTitle: task.taskTitle,
    taskDescription: task.taskDescription,
    status: task.status,
    version: task.version,
    parentUuid: task.parentTask?.uuid ?? null,
    skills: (task.taskSkillMappers ?? []).map((m) => ({
      uuid: m.skill.uuid,
      skillName: m.skill.skillName,
    })),
    assignedDeveloper: assignment
      ? { uuid: assignment.developer.uuid, name: assignment.developer.name }
      : null,
    createdDate: task.createdDate,
    modifiedDate: task.modifiedDate,
  };
}
