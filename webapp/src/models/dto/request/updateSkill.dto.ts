import { PartialType } from '@nestjs/mapped-types';
import { CreateSkillDto } from './createSkill.dto.js';

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}
