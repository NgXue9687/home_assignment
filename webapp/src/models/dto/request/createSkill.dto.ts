import { IsString, IsNotEmpty, MaxLength, IsIn } from 'class-validator';
import {
  RECORD_STATUSES,
  RecordStatus,
} from '../../../shared/constants/recordStatus.js';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  skillName: string;

  @IsString()
  @IsNotEmpty()
  skillDescription: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(RECORD_STATUSES, {
    message: `status must be one of: ${RECORD_STATUSES.join(', ')}`,
  })
  status: RecordStatus;
}
