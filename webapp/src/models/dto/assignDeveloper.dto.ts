import { IsUUID } from 'class-validator';

export class AssignDeveloperDto {
  @IsUUID()
  developerUuid: string;
}
