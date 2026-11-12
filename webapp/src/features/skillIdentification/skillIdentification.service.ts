import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillEntity } from '../../models/entity/skill.entity.js';
import { CreateTaskDto } from '../../models/dto/request/createTask.dto.js';
import { RecordStatus } from '../../shared/constants/recordStatus.js';
import { SysMessage } from '../../shared/constants/sysMessages.js';
import { LLM_CLIENT, type LlmClient } from './llm/llmClient.js';
import {
  buildResponseSchema,
  buildSystemPrompt,
  buildUserPrompt,
  collectTasksWithoutSkills,
  matchSkills,
  readAnswer,
} from '../../shared/utils/skillIdentification.prompt.js';

@Injectable()
export class SkillIdentificationService {
  private readonly logger = new Logger(SkillIdentificationService.name);

  constructor(
    @InjectRepository(SkillEntity)
    private readonly skillsRepository: Repository<SkillEntity>,
    @Inject(LLM_CLIENT) private readonly llmClient: LlmClient | null,
  ) {}

  // Asks the LLM for the skills of the task and each subtask that was sent
  // without skillUuids. Every one of them must get at least one skill: if the
  // LLM is not configured, fails, or leaves any task without a skill, this
  // throws (503) and nothing is saved, so the user can try again. A task saved
  // without skills could be assigned to any developer, which would get around
  // the rule that a task only goes to a developer with its skills.
  async identifyForTaskTree(
    task: CreateTaskDto,
  ): Promise<Map<CreateTaskDto, SkillEntity[]>> {
    const tasks = collectTasksWithoutSkills(task);
    if (tasks.length === 0) return new Map();

    try {
      return await this.identify(tasks);
    } catch (error) {
      this.logger.warn(
        `Skill identification failed, the task was not saved: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(SysMessage.TASK_SAVE_FAILED);
    }
  }

  private async identify(
    tasks: CreateTaskDto[],
  ): Promise<Map<CreateTaskDto, SkillEntity[]>> {
    if (this.llmClient === null) {
      throw new Error('no LLM is configured (see LLM_PROVIDER / LLM_API_KEY)');
    }
    const skills = await this.skillsRepository.find({
      where: { status: RecordStatus.ACTIVE },
      order: { skillName: 'ASC' },
    });
    if (skills.length === 0) throw new Error('there are no active skills');

    const answer = await this.llmClient.generateJson({
      systemPrompt: buildSystemPrompt(skills),
      userPrompt: buildUserPrompt(tasks),
      responseSchema: buildResponseSchema(skills),
    });

    this.logger.log(`LLM answer: ${JSON.stringify(answer)}`);

    const identified = new Map<CreateTaskDto, SkillEntity[]>();
    for (const { index, skillNames } of readAnswer(answer)) {
      const matchedTask = tasks[index];
      const matchedSkills = matchSkills(skillNames, skills);
      if (matchedTask && matchedSkills.length > 0) {
        identified.set(matchedTask, matchedSkills);
      }
    }
    if (identified.size < tasks.length) {
      throw new Error(
        `the LLM identified skills for only ${identified.size} of ${tasks.length} tasks`,
      );
    }
    return identified;
  }
}
