import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from '../../models/entity/task.entity.js';
import { TaskMapperEntity } from '../../models/entity/taskMapper.entity.js';
import { TaskSkillMapperEntity } from '../../models/entity/taskSkillMapper.entity.js';
import { TasksService } from './tasks.service.js';
import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { SysConfigModule } from '../sysconfig/sysconfig.module.js';
import { SkillIdentificationModule } from '../skillIdentification/skillIdentification.module.js';

@Module({
  imports: [
    SysConfigModule,
    SkillIdentificationModule,
    TypeOrmModule.forFeature([
      TaskEntity,
      TaskMapperEntity,
      TaskSkillMapperEntity,
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
