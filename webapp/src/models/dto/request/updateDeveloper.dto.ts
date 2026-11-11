import { PartialType } from '@nestjs/mapped-types';
import { CreateDeveloperDto } from './createDeveloper.dto.js';

export class UpdateDeveloperDto extends PartialType(CreateDeveloperDto) {}
