import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SkillsService } from '../../../src/features/skills/skills.service.js';
import { SkillEntity } from '../../../src/models/entity/skill.entity.js';
import { SysMessageFormat } from '../../../src/shared/constants/sysMessages.js';

const backend = Object.assign(new SkillEntity(), {
  skillId: '2',
  uuid: 'skill-uuid',
  skillName: 'Backend',
  skillDescription: 'Server-side work',
  status: 'A',
});
const backendResponse = {
  uuid: 'skill-uuid',
  skillName: 'Backend',
  skillDescription: 'Server-side work',
  status: 'A',
};

describe('SkillsService', () => {
  let skillsService: SkillsService;
  const skillsRepository = { find: vi.fn(), findOneBy: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: getRepositoryToken(SkillEntity),
          useValue: skillsRepository,
        },
      ],
    }).compile();
    skillsService = moduleRef.get(SkillsService);
  });

  it('lists skills by name without internal ids', async () => {
    skillsRepository.find.mockResolvedValue([backend]);

    await expect(skillsService.findAll()).resolves.toEqual([backendResponse]);
    expect(skillsRepository.find).toHaveBeenCalledWith({
      order: { skillName: 'ASC' },
    });
  });

  it('returns one skill by uuid', async () => {
    skillsRepository.findOneBy.mockResolvedValue(backend);

    await expect(skillsService.findOne('skill-uuid')).resolves.toEqual(
      backendResponse,
    );
    expect(skillsRepository.findOneBy).toHaveBeenCalledWith({
      uuid: 'skill-uuid',
    });
  });

  it('throws NotFoundException when the skill does not exist', async () => {
    skillsRepository.findOneBy.mockResolvedValue(null);

    await expect(skillsService.findOne('missing-uuid')).rejects.toThrow(
      new NotFoundException(SysMessageFormat.skillNotFound('missing-uuid')),
    );
  });
});
