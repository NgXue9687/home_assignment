import { Test } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SkillIdentificationService } from '../../../src/features/skillIdentification/skillIdentification.service.js';
import { LLM_CLIENT } from '../../../src/features/skillIdentification/llm/llmClient.js';
import { SkillEntity } from '../../../src/models/entity/skill.entity.js';
import { CreateTaskDto } from '../../../src/models/dto/request/createTask.dto.js';

const frontend = Object.assign(new SkillEntity(), {
  skillId: '1',
  skillName: 'Frontend',
  skillDescription: 'Builds the user interface.',
});
const backend = Object.assign(new SkillEntity(), {
  skillId: '2',
  skillName: 'Backend',
  skillDescription: 'Builds APIs and databases.',
});

describe('SkillIdentificationService', () => {
  const skillsRepository = { find: vi.fn() };
  const llmClient = { generateJson: vi.fn() };

  async function createService(
    client: typeof llmClient | null = llmClient,
  ): Promise<SkillIdentificationService> {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SkillIdentificationService,
        {
          provide: getRepositoryToken(SkillEntity),
          useValue: skillsRepository,
        },
        { provide: LLM_CLIENT, useValue: client },
      ],
    }).compile();
    return moduleRef.get(SkillIdentificationService);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    skillsRepository.find.mockResolvedValue([backend, frontend]);
  });

  it('identifies skills for the task and its subtasks in one LLM call', async () => {
    const child: CreateTaskDto = { taskTitle: 'Store audit logs' };
    const task: CreateTaskDto = {
      taskTitle: 'Profile page with picture upload',
      subtasks: [child],
    };
    llmClient.generateJson.mockResolvedValue({
      tasks: [
        { index: 0, skills: ['Frontend', 'Backend'] },
        { index: 1, skills: ['Backend'] },
      ],
    });

    const identified = await (await createService()).identifyForTaskTree(task);

    expect(llmClient.generateJson).toHaveBeenCalledTimes(1);
    expect(identified.get(task)).toEqual([frontend, backend]);
    expect(identified.get(child)).toEqual([backend]);
  });

  it('only asks about tasks that were sent without skills', async () => {
    const child: CreateTaskDto = { taskTitle: 'Responsive homepage' };
    const task: CreateTaskDto = {
      taskTitle: 'Already has skills',
      skillUuids: ['some-uuid'],
      subtasks: [child],
    };
    llmClient.generateJson.mockResolvedValue({
      tasks: [{ index: 0, skills: ['Frontend'] }],
    });

    const identified = await (await createService()).identifyForTaskTree(task);

    const { userPrompt } = llmClient.generateJson.mock.calls[0][0];
    expect(userPrompt).toContain('Responsive homepage');
    expect(userPrompt).not.toContain('Already has skills');
    expect(identified.has(task)).toBe(false);
    expect(identified.get(child)).toEqual([frontend]);
  });

  it('does not call the LLM when every task already has skills', async () => {
    const identified = await (
      await createService()
    ).identifyForTaskTree({ taskTitle: 'Task', skillUuids: ['some-uuid'] });

    expect(llmClient.generateJson).not.toHaveBeenCalled();
    expect(identified.size).toBe(0);
  });

  it('refuses to save when no LLM is configured', async () => {
    await expect(
      (await createService(null)).identifyForTaskTree({ taskTitle: 'Task' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(skillsRepository.find).not.toHaveBeenCalled();
  });

  it('limits the LLM to the skills in the database', async () => {
    llmClient.generateJson.mockResolvedValue({
      tasks: [{ index: 0, skills: ['Backend'] }],
    });

    await (await createService()).identifyForTaskTree({ taskTitle: 'Task' });

    const { systemPrompt, responseSchema } =
      llmClient.generateJson.mock.calls[0][0];
    expect(systemPrompt).toContain('- Backend: Builds APIs and databases.');
    expect(JSON.stringify(responseSchema)).toContain(
      '"enum":["Backend","Frontend"]',
    );
  });

  it('drops skill names that do not exist and matches names ignoring case', async () => {
    const task: CreateTaskDto = { taskTitle: 'Task' };
    llmClient.generateJson.mockResolvedValue({
      tasks: [{ index: 0, skills: ['DevOps', ' frontend ', 'Frontend'] }],
    });

    const identified = await (await createService()).identifyForTaskTree(task);

    expect(identified.get(task)).toEqual([frontend]);
  });

  it('refuses to save when the answer leaves a task without skills', async () => {
    llmClient.generateJson.mockResolvedValue({
      tasks: [{ index: 7, skills: ['Backend'] }, { index: 'x' }, null],
    });

    await expect(
      (await createService()).identifyForTaskTree({ taskTitle: 'Task' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('refuses to save, with a message to try again, when the LLM fails', async () => {
    llmClient.generateJson.mockRejectedValue(new Error('HTTP 503'));

    await expect(
      (await createService()).identifyForTaskTree({ taskTitle: 'Task' }),
    ).rejects.toThrow('Failed to save the task, please try again');
  });

  it('refuses to save when there are no active skills', async () => {
    skillsRepository.find.mockResolvedValue([]);

    await expect(
      (await createService()).identifyForTaskTree({ taskTitle: 'Task' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(llmClient.generateJson).not.toHaveBeenCalled();
  });
});
