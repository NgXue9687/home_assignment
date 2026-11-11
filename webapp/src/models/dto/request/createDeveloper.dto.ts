import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsIn,
} from 'class-validator';
import {
  RECORD_STATUSES,
  RecordStatus,
} from '../../../shared/constants/recordStatus.js';

export class CreateDeveloperDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(320)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  division?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  designation?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(RECORD_STATUSES, {
    message: `status must be one of: ${RECORD_STATUSES.join(', ')}`,
  })
  status: RecordStatus;
}
