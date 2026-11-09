import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeveloperEntity } from '../../models/entity/developer.entity.js';
import {
  DeveloperResponseDto,
  toDeveloperResponse,
} from '../../models/dto/response/developerResponse.dto.js';
import { SysMessageFormat } from '../../shared/constants/sysMessages.js';

@Injectable()
export class DevelopersService {
  constructor(
    @InjectRepository(DeveloperEntity)
    private readonly developersRepository: Repository<DeveloperEntity>,
  ) {}

  async findAll(): Promise<DeveloperResponseDto[]> {
    const developers = await this.developersRepository.find({
      relations: { developerSkillMappers: { skill: true } },
      order: { name: 'ASC' },
    });
    return developers.map(toDeveloperResponse);
  }

  async findOne(uuid: string): Promise<DeveloperResponseDto> {
    const developer = await this.developersRepository.findOne({
      where: { uuid },
      relations: { developerSkillMappers: { skill: true } },
    });
    if (!developer)
      throw new NotFoundException(SysMessageFormat.developerNotFound(uuid));
    return toDeveloperResponse(developer);
  }
}
