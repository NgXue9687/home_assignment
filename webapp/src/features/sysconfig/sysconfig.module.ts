import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysConfigEntity } from '../../models/entity/sysconfig.entity.js';
import { SysConfigService } from './sysconfig.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SysConfigEntity])],
  providers: [SysConfigService],
  exports: [SysConfigService],
})
export class SysConfigModule {}
