import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { SkillsService } from './skills.service.js';
import { UserActionGuard } from '../../shared/auth/userAction.guard.js';
import { SkillResponseDto } from '../../models/dto/response/skillResponse.dto.js';

@UseGuards(UserActionGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  /**
   *
   * @returns List of Skills to frontend
   */
  @Get()
  findAll(): Promise<SkillResponseDto[]> {
    return this.skillsService.findAll();
  }

  /**
   *
   * @param id Uuid of the skill
   * @returns a single skill from the database
   */

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SkillResponseDto> {
    return this.skillsService.findOne(id);
  }
}
