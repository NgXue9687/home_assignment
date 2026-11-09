import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { DeveloperEntity } from '../../models/entity/developer.entity.js';
import { DeveloperSkillMapperEntity } from '../../models/entity/developerSkillMapper.entity.js';
import { DevelopersService } from './developers.service.js';
import { DevelopersController } from './developers.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeveloperEntity, DeveloperSkillMapperEntity]),
  ],
  controllers: [DevelopersController],
  providers: [DevelopersService],
})
export class DevelopersModule {}
