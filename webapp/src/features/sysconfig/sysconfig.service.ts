import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SysConfigEntity } from '../../models/entity/sysconfig.entity.js';
import { SysConfigKey } from '../../shared/constants/sysConfig.js';
import { SysMessage } from '../../shared/constants/sysMessages.js';
import { SysConfigResponseDto, toSysConfigResponse } from '../../models/dto/response/sysConfigResponseDto.js';

@Injectable()
export class SysConfigService {
  private readonly logger = new Logger(SysConfigService.name);

  constructor(
    @InjectRepository(SysConfigEntity)
    private readonly sysConfigRepository: Repository<SysConfigEntity>,
  ) {}

  // Only one system configuration, which to limit the depth of the nesting of subtasks.

  async getSysConfigValues(sysConfigList: SysConfigKey[]): Promise<SysConfigResponseDto[]>{
    const sysconfigs = await this.sysConfigRepository.find({
      where: {sysConfigName: In(sysConfigList)},
      order: {sysConfigName: 'ASC'}
    }
    )

    return sysconfigs.map(toSysConfigResponse);
  }

  /**
   *
   * @param sysConfigName System Configuration to retrieve from the database
   * @returns             Returns the int value of the system configuration as a Number
   */
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
