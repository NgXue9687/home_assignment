import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './createTask.dto.js';

// Every create field becomes optional. Required skills and subtasks are set at creation only.
// The validation decorators are copied over automatically.
export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['skillUuids', 'subtasks'] as const),
) {}
