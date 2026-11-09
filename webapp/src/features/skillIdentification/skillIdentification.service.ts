import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillEntity } from '../../models/entity/skill.entity.js';
import { CreateTaskDto } from '../../models/dto/createTask.dto.js';
import { RecordStatus } from '../../shared/constants/recordStatus.js';
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
  // without skillUuids. Never throws: if the LLM is not configured, fails or
  // answers badly, those tasks are still created, just without skills.
  async identifyForTaskTree(
    task: CreateTaskDto,
  ): Promise<Map<CreateTaskDto, SkillEntity[]>> {
    const identified = new Map<CreateTaskDto, SkillEntity[]>();
    const tasks = collectTasksWithoutSkills(task);
    if (tasks.length === 0 || this.llmClient === null) return identified;

    try {
      const skills = await this.skillsRepository.find({
        where: { status: RecordStatus.ACTIVE },
        order: { skillName: 'ASC' },
      });
      if (skills.length === 0) return identified;

      const answer = await this.llmClient.generateJson({
        systemPrompt: buildSystemPrompt(skills),
        userPrompt: buildUserPrompt(tasks),
        responseSchema: buildResponseSchema(skills),
      });
      for (const { index, skillNames } of readAnswer(answer)) {
        const matchedTask = tasks[index];
        const matchedSkills = matchSkills(skillNames, skills);
        if (matchedTask && matchedSkills.length > 0) {
          identified.set(matchedTask, matchedSkills);
        }
      }
      if (identified.size < tasks.length) {
        this.logger.warn(
          `The LLM identified skills for ${identified.size} of ${tasks.length} tasks`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Skill identification failed, creating the tasks without skills: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return identified;
  }
}
