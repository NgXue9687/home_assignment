import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DevelopersService } from '../../../src/features/developers/developers.service.js';
import { DeveloperEntity } from '../../../src/models/entity/developer.entity.js';
import { SysMessageFormat } from '../../../src/shared/constants/sysMessages.js';

const alice = Object.assign(new DeveloperEntity(), {
  developerId: '1',
  uuid: 'developer-uuid',
  name: 'Alice',
  email: 'alice@example.com',
  division: 'Engineering',
  designation: 'Engineer',
  status: 'A',
  developerSkillMappers: [
    { skill: { uuid: 'skill-uuid', skillName: 'Frontend' } },
  ],
});
const aliceResponse = {
  uuid: 'developer-uuid',
  name: 'Alice',
  email: 'alice@example.com',
  division: 'Engineering',
  designation: 'Engineer',
  status: 'A',
  skills: [{ uuid: 'skill-uuid', skillName: 'Frontend' }],
};

describe('DevelopersService', () => {
  let developersService: DevelopersService;
  const developersRepository = { find: vi.fn(), findOne: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        DevelopersService,
        {
          provide: getRepositoryToken(DeveloperEntity),
          useValue: developersRepository,
        },
      ],
    }).compile();
    developersService = moduleRef.get(DevelopersService);
  });

  it('lists developers by name with their skills and without internal ids', async () => {
    developersRepository.find.mockResolvedValue([alice]);

    await expect(developersService.findAll()).resolves.toEqual([aliceResponse]);
    expect(developersRepository.find).toHaveBeenCalledWith({
      relations: { developerSkillMappers: { skill: true } },
      order: { name: 'ASC' },
    });
  });

  it('returns an empty list when there are no developers', async () => {
    developersRepository.find.mockResolvedValue([]);

    await expect(developersService.findAll()).resolves.toEqual([]);
  });

  it('returns one developer by uuid', async () => {
    developersRepository.findOne.mockResolvedValue(alice);

    await expect(developersService.findOne('developer-uuid')).resolves.toEqual(
      aliceResponse,
    );
    expect(developersRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { uuid: 'developer-uuid' } }),
    );
  });

  it('throws NotFoundException when the developer does not exist', async () => {
    developersRepository.findOne.mockResolvedValue(null);

    await expect(developersService.findOne('missing-uuid')).rejects.toThrow(
      new NotFoundException(SysMessageFormat.developerNotFound('missing-uuid')),
    );
  });
});
