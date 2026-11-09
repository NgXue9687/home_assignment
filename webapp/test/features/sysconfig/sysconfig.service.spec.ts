import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import type { MockInstance } from 'vitest';
import { SysConfigService } from '../../../src/features/sysconfig/sysconfig.service.js';
import { SysConfigEntity } from '../../../src/models/entity/sysconfig.entity.js';
import { SysConfigKey } from '../../../src/shared/constants/sysConfig.js';
import { SysMessage } from '../../../src/shared/constants/sysMessages.js';

describe('SysConfigService.getInt', () => {
  let sysConfigService: SysConfigService;
  let loggerError: MockInstance<Logger['error']>;
  const sysConfigRepository = { findOneBy: vi.fn() };
  const expectedError = new InternalServerErrorException(
    SysMessage.SYSCONFIG_GENRAL_ERROR,
  );
  const expectedLog = `sysconfig "${SysConfigKey.MAX_SUBTASK_LIST_SIZE}" is missing or is not a whole number`;

  beforeEach(async () => {
    vi.clearAllMocks();
    loggerError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        SysConfigService,
        {
          provide: getRepositoryToken(SysConfigEntity),
          useValue: sysConfigRepository,
        },
      ],
    }).compile();
    sysConfigService = moduleRef.get(SysConfigService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the stored value as a number', async () => {
    sysConfigRepository.findOneBy.mockResolvedValue({ sysConfigValue: '5' });

    await expect(
      sysConfigService.getInt(SysConfigKey.MAX_SUBTASK_LIST_SIZE),
    ).resolves.toBe(5);
    expect(sysConfigRepository.findOneBy).toHaveBeenCalledWith({
      sysConfigName: 'MAX_SUBTASK_LIST_SIZE',
    });
    expect(loggerError).not.toHaveBeenCalled();
  });

  it('throws InternalServerErrorException and logs when the row is missing', async () => {
    sysConfigRepository.findOneBy.mockResolvedValue(null);

    await expect(
      sysConfigService.getInt(SysConfigKey.MAX_SUBTASK_LIST_SIZE),
    ).rejects.toThrow(expectedError);
    expect(loggerError).toHaveBeenCalledWith(expectedLog);
  });

  it.each(['', ' ', 'five', '-1', '2.5'])(
    'throws InternalServerErrorException and logs when the value is "%s"',
    async (sysConfigValue) => {
      sysConfigRepository.findOneBy.mockResolvedValue({ sysConfigValue });

      await expect(
        sysConfigService.getInt(SysConfigKey.MAX_SUBTASK_LIST_SIZE),
      ).rejects.toThrow(expectedError);
      expect(loggerError).toHaveBeenCalledWith(expectedLog);
    },
  );
});
