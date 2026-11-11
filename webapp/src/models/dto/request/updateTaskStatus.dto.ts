import { IsIn } from 'class-validator';
import {
  TASK_STATUSES,
  TaskStatus,
} from '../../../shared/constants/taskStatus.js';

export class UpdateTaskStatus {
  @IsIn(TASK_STATUSES, {
    message: `status must be one of: ${TASK_STATUSES.join(', ')}`,
  })
  status: TaskStatus;
}
