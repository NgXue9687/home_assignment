import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserActionGuard } from '../../shared/auth/userAction.guard.js';
import { SysConfigService } from './sysconfig.service.js';
import { SysConfigKey } from '../../shared/constants/sysConfig.js';
import { SysConfigResponseDto } from '../../models/dto/response/sysConfigResponseDto.js';

@UseGuards(UserActionGuard)
@Controller('sysconfigs')
export class SysConfigsController {
  constructor(private readonly sysConfigService: SysConfigService) {}

  @Get()
  findAll(): Promise<SysConfigResponseDto[]> {
    return this.sysConfigService.getSysConfigValues([
      SysConfigKey.MAX_SUBTASK_LIST_SIZE,
    ]);
  }
}
