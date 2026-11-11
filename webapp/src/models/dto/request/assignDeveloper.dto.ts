import { Transform } from 'class-transformer';
import { IsUUID, ValidateIf } from 'class-validator';

export class AssignDeveloperDto {
  // null (or an empty string) removes the current assignee.
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((dto: AssignDeveloperDto) => dto.developerUuid !== null)
  @IsUUID()
  developerUuid: string | null;
}
