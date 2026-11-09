import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './createTask.dto.js';

// Every create field becomes optional. Required skills and subtasks are set at creation only,
// and the status has its own endpoint (PUT /tasks/:id/status) because it has business rules.
// The validation decorators are copied over automatically.
export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['skillUuids', 'subtasks', 'status'] as const),
) {}
