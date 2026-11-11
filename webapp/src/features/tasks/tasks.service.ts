import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsRelations, In, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { TaskEntity } from '../../models/entity/task.entity.js';
import { DeveloperEntity } from '../../models/entity/developer.entity.js';
import { SkillEntity } from '../../models/entity/skill.entity.js';
import { TaskMapperEntity } from '../../models/entity/taskMapper.entity.js';
import { TaskSkillMapperEntity } from '../../models/entity/taskSkillMapper.entity.js';
import { CreateTaskDto } from '../../models/dto/request/createTask.dto.js';
import { UpdateTaskDto } from '../../models/dto/request/updateTask.dto.js';
import {
  TaskResponseDto,
  toTaskResponse,
} from '../../models/dto/response/taskResponse.dto.js';
import { ListTasksQueryDto } from '../../models/dto/query/listTasksQuery.dto.js';
import { PagedResponseDto } from '../../models/dto/response/pagedResponse.dto.js';
import { TaskStatus } from '../../shared/constants/taskStatus.js';

import { findMissingSkillIds } from '../../shared/utils/tasks.skills.matcher.js';
import {
  getSubtaskDepth,
  hasUnfinishedSubtasks,
} from '../../shared/utils/tasks.utils.js';
import { SysConfigService } from '../sysconfig/sysconfig.service.js';
import { SkillIdentificationService } from '../skillIdentification/skillIdentification.service.js';
import { SYSTEM_USER } from '../../shared/constants/auditUser.js';
import { SysConfigKey } from '../../shared/constants/sysConfig.js';
import {
  SysMessage,
  SysMessageFormat,
} from '../../shared/constants/sysMessages.js';

// Status changes run one at a time (see changeStatus), so this id is only ever used for that lock.
const STATUS_CHANGE_LOCK_ID = 4201;

const TASK_RELATIONS: FindOptionsRelations<TaskEntity> = {
  taskSkillMappers: { skill: true },
  taskMappers: { developer: true },
  parentTask: true,
};

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly tasksRepository: Repository<TaskEntity>,
    private readonly sysConfigService: SysConfigService,
    private readonly skillIdentificationService: SkillIdentificationService,
  ) {}

  /**
   *
   * @param dto Created Task Details from frontend
   * @param currentUser Current user creating the task
   * @returns   Created Task from the database
   */
  async create(
    dto: CreateTaskDto,
    currentUser: string,
  ): Promise<TaskResponseDto> {
    const maxSubtaskList = await this.sysConfigService.getInt(
      SysConfigKey.MAX_SUBTASK_LIST_SIZE,
    );
    if (getSubtaskDepth(dto) > maxSubtaskList) {
      throw new BadRequestException(
        SysMessageFormat.subtaskDepthExceeded(maxSubtaskList),
      );
    }
    // Asked before the transaction starts, so no database transaction is held
    // open while waiting for the LLM.
    const identifiedSkills =
      await this.skillIdentificationService.identifyForTaskTree(dto);
    const savedTask = await this.tasksRepository.manager.transaction(
      (manager) =>
        this.createTaskTree(manager, dto, currentUser, null, identifiedSkills),
    );
    return this.findOne(savedTask.uuid);
  }

  /**
   *
   * @param query  To retrieve the associated tasks based on query
   * @returns       Pagination of the list of tasks
   */
  async findAll(
    query: ListTasksQueryDto,
  ): Promise<PagedResponseDto<TaskResponseDto>> {
    const [tasks, total] = await this.tasksRepository.findAndCount({
      relations: TASK_RELATIONS,
      order: { createdDate: 'DESC', taskId: 'DESC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return {
      items: tasks.map(toTaskResponse),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findOne(uuid: string): Promise<TaskResponseDto> {
    return toTaskResponse(await this.findEntity(uuid, TASK_RELATIONS));
  }

  async update(
    uuid: string,
    dto: UpdateTaskDto,
    currentUser: string,
  ): Promise<TaskResponseDto> {
    const task = await this.findEntity(uuid);
    this.tasksRepository.merge(task, dto);
    task.modifiedBy = currentUser;
    await this.tasksRepository.save(task);
    return this.findOne(uuid);
  }

  // Two status changes at the same moment could each pass the Done rule and then
  // break it together (A -> Done while B -> To-do). The lock makes them take turns,
  // and each one then reads the data the previous one saved.
  async changeStatus(
    uuid: string,
    status: TaskStatus,
    currentUser: string,
  ): Promise<TaskResponseDto> {
    await this.tasksRepository.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [
        STATUS_CHANGE_LOCK_ID,
      ]);
      const task = await manager.findOne(TaskEntity, { where: { uuid } });
      if (!task)
        throw new NotFoundException(SysMessageFormat.taskNotFound(uuid));

      if (status === TaskStatus.DONE) {
        await this.assertSubtasksAreDone(manager, task);
      } else {
        await this.assertParentIsNotDone(manager, task);
      }
      task.status = status;
      task.modifiedBy = currentUser;
      await manager.save(task);
    });
    return this.findOne(uuid);
  }

  // A null developerUuid removes the current assignee.
  async assignDeveloper(
    taskUuid: string,
    developerUuid: string | null,
    currentUser: string,
  ): Promise<TaskResponseDto> {
    await this.tasksRepository.manager.transaction(async (manager) => {
      const task = await manager.findOne(TaskEntity, {
        where: { uuid: taskUuid },
        relations: { taskSkillMappers: true },
      });
      if (!task)
        throw new NotFoundException(SysMessageFormat.taskNotFound(taskUuid));

      if (developerUuid === null) {
        await this.removeAssignee(manager, task, currentUser);
      } else {
        await this.replaceAssignee(manager, task, developerUuid, currentUser);
      }
    });
    return this.findOne(taskUuid);
  }

  // Deletes a Task, but only soft deleted
  async remove(uuid: string, currentUser: string): Promise<void> {
    const task = await this.findEntity(uuid);
    const subtaskCount = await this.tasksRepository.count({
      where: { parentTaskId: task.taskId },
    });
    if (subtaskCount > 0) {
      throw new ConflictException(SysMessage.TASK_HAS_SUBTASKS);
    }
    await this.tasksRepository.manager.transaction(async (manager) => {
      task.modifiedBy = currentUser;
      await manager.save(task);
      await manager.softRemove(task);
    });
  }

  // Saves a task, its required skills, then its subtasks (which can have subtasks too).
  // identifiedSkills holds the skills the LLM found for tasks sent without skillUuids.
  private async createTaskTree(
    manager: EntityManager,
    dto: CreateTaskDto,
    currentUser: string,
    parentTaskId: string | null,
    identifiedSkills: Map<CreateTaskDto, SkillEntity[]>,
  ): Promise<TaskEntity> {
    const subtaskDtos = dto.subtasks ?? [];
    const status = dto.status ?? TaskStatus.TODO;

    // Check if there is still Subtasks that is not updated to Done
    if (
      status === TaskStatus.DONE &&
      hasUnfinishedSubtasks(
        subtaskDtos.map((subtask) => subtask.status ?? TaskStatus.TODO),
      )
    ) {
      throw new UnprocessableEntityException(SysMessage.SUBTASKS_NOT_DONE);
    }

    const skillUuids = dto.skillUuids ?? [];
    let skills: SkillEntity[];
    let skillsAddedBy = currentUser;
    if (skillUuids.length > 0) {
      skills = await manager.findBy(SkillEntity, { uuid: In(skillUuids) });
      if (skills.length !== skillUuids.length) {
        throw new BadRequestException(SysMessage.SKILLS_NOT_FOUND);
      }
    } else {
      // No skills given: use the ones the LLM identified, recorded as added by
      // the system so they can be told apart from skills a user chose.
      skills = identifiedSkills.get(dto) ?? [];
      skillsAddedBy = SYSTEM_USER;
    }

    const task = await manager.save(
      manager.create(TaskEntity, {
        taskTitle: dto.taskTitle,
        taskDescription: dto.taskDescription,
        status: dto.status,
        parentTaskId,
        uuid: randomUUID(),
        createdBy: currentUser,
        modifiedBy: currentUser,
      }),
    );
    await manager.save(
      skills.map((skill) =>
        manager.create(TaskSkillMapperEntity, {
          taskId: task.taskId,
          skillId: skill.skillId,
          createdBy: skillsAddedBy,
          modifiedBy: skillsAddedBy,
        }),
      ),
    );
    for (const subtaskDto of subtaskDtos) {
      await this.createTaskTree(
        manager,
        subtaskDto,
        currentUser,
        task.taskId,
        identifiedSkills,
      );
    }
    return task;
  }

  /**
   *
   * @param manager       Find respository associated with current Entity
   * @param task          Task Entity
   * @param currentUser   Current User replacing the assignee
   */
  private async removeAssignee(
    manager: EntityManager,
    task: TaskEntity,
    currentUser: string,
  ): Promise<void> {
    await manager.delete(TaskMapperEntity, { taskId: task.taskId });
    await manager.update(
      TaskEntity,
      { taskId: task.taskId },
      { modifiedBy: currentUser },
    );
  }

  /**
   *
   * @param manager       Find respository associated with current Entity
   * @param task          Task Entity
   * @param developerUuid Uuid of Developer
   * @param currentUser   Current User replacing the assignee
   */
  private async replaceAssignee(
    manager: EntityManager,
    task: TaskEntity,
    developerUuid: string,
    currentUser: string,
  ): Promise<void> {
    const developer = await manager.findOne(DeveloperEntity, {
      where: { uuid: developerUuid },
      relations: { developerSkillMappers: true },
    });

    // Unable to find the developer from database
    if (!developer)
      throw new NotFoundException(
        SysMessageFormat.developerNotFound(developerUuid),
      );

    const missingSkillIds = findMissingSkillIds(
      task.taskSkillMappers.map((mapper) => mapper.skillId),
      developer.developerSkillMappers.map((mapper) => mapper.skillId),
    );

    // Developer does not have the necessary skills for the task
    if (missingSkillIds.length > 0) {
      throw new UnprocessableEntityException(
        SysMessageFormat.developerLacksSkills(developer.name, task.uuid),
      );
    }

    // Delete the previous Task Mapping and create a new Task Mapping with the new developer assigned
    await manager.delete(TaskMapperEntity, { taskId: task.taskId });
    await manager.save(
      manager.create(TaskMapperEntity, {
        taskId: task.taskId,
        developerId: developer.developerId,
        createdBy: currentUser,
        modifiedBy: currentUser,
      }),
    );
  }

  /**
   * Helper Method to check if Subtasks Task Status are Done.
   *
   * @param manager Find respository associated with current Entity
   * @param task    Task Entity  
   */
  private async assertSubtasksAreDone(
    manager: EntityManager,
    task: TaskEntity,
  ): Promise<void> {
    const subtasks = await manager.find(TaskEntity, {
      where: { parentTaskId: task.taskId },
      select: { status: true },
    });
    if (hasUnfinishedSubtasks(subtasks.map((subtask) => subtask.status))) {
      throw new UnprocessableEntityException(SysMessage.SUBTASKS_NOT_DONE);
    }
  }

  /**
   * Helper Method to check if Parent Task Status is not Done.
   *
   * @param manager Find respository associated with current Entity
   * @param task    Task Entity  
   */
  private async assertParentIsNotDone(
    manager: EntityManager,
    task: TaskEntity,
  ): Promise<void> {
    if (task.parentTaskId === null) return;
    const parent = await manager.findOne(TaskEntity, {
      where: { taskId: task.parentTaskId },
      select: { status: true },
    });
    if (parent?.status === TaskStatus.DONE) {
      throw new UnprocessableEntityException(SysMessage.PARENT_TASK_DONE);
    }
  }

  /**
   *
   * @param uuid         Uuid of Task
   * @param relations    Relationship of TaskEntity with other table columns, taskSkillMappers, taskMappers, parenttask column
   * @returns             Task found from Database
   */
  private async findEntity(
    uuid: string,
    relations?: FindOptionsRelations<TaskEntity>,
  ): Promise<TaskEntity> {
    const task = await this.tasksRepository.findOne({
      where: { uuid },
      relations,
    });
    if (!task) throw new NotFoundException(SysMessageFormat.taskNotFound(uuid));
    return task;
  }
}
