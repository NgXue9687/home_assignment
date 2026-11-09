import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysConfigEntity } from '../../models/entity/sysconfig.entity.js';
import { SysConfigKey } from '../../shared/constants/sysConfig.js';
import { SysMessage } from '../../shared/constants/sysMessages.js';

@Injectable()
export class SysConfigService {
  private readonly logger = new Logger(SysConfigService.name);

  constructor(
    @InjectRepository(SysConfigEntity)
    private readonly sysConfigRepository: Repository<SysConfigEntity>,
  ) {}

  async getInt(sysConfigName: SysConfigKey): Promise<number> {
    const row = await this.sysConfigRepository.findOneBy({ sysConfigName });
    if (!row || !/^\d+$/.test(row.sysConfigValue)) {
      this.logger.error(
        `sysconfig "${sysConfigName}" is missing or is not a whole number`,
      );
      throw new InternalServerErrorException(SysMessage.SYSCONFIG_GENRAL_ERROR);
    }
    return Number(row.sysConfigValue);
  }
}
