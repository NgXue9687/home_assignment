import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysConfigEntity } from '../../models/entity/sysconfig.entity.js';
import { SysConfigService } from './sysconfig.service.js';
import { SysConfigsController } from './sysconfig.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([SysConfigEntity])],
  controllers: [SysConfigsController],
  providers: [SysConfigService],
  exports: [SysConfigService],
})
export class SysConfigModule {}
