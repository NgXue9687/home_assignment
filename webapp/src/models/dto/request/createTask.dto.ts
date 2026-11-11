import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsIn,
  IsArray,
  ArrayUnique,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  TASK_STATUSES,
  TaskStatus,
} from '../../../shared/constants/taskStatus.js';

// Trims strings so "   " counts as empty and stray spaces aren't stored.
const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class CreateTaskDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  taskTitle: string;

  @Trim()
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  taskDescription?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES, {
    message: `status must be one of: ${TASK_STATUSES.join(', ')}`,
  })
  status?: TaskStatus;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  skillUuids?: string[];

  // Subtasks have the same properties as a task, and can have subtasks of their own.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  subtasks?: CreateTaskDto[];
}
