import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillEntity } from '../../models/entity/skill.entity.js';
import {
  SkillResponseDto,
  toSkillResponse,
} from '../../models/dto/response/skillResponse.dto.js';
import { SysMessageFormat } from '../../shared/constants/sysMessages.js';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(SkillEntity)
    private readonly skillsRepository: Repository<SkillEntity>,
  ) {}

  /**
   *
   * @returns List of Skills from the database in Ascending Order
   */
  async findAll(): Promise<SkillResponseDto[]> {
    const skills = await this.skillsRepository.find({
      order: { skillName: 'ASC' },
    });
    return skills.map(toSkillResponse);
  }

  /**
   *
   * @param uuid Uuid of the Skill
   * @returns    A single Skill from the database
   */
  async findOne(uuid: string): Promise<SkillResponseDto> {
    const skill = await this.skillsRepository.findOneBy({ uuid });
    if (!skill)
      throw new NotFoundException(SysMessageFormat.skillNotFound(uuid));
    return toSkillResponse(skill);
  }
}
