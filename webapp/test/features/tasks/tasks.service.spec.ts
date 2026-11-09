import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TasksService } from '../../../src/features/tasks/tasks.service.js';
import { TaskEntity } from '../../../src/models/entity/task.entity.js';
import { TaskMapperEntity } from '../../../src/models/entity/taskMapper.entity.js';
import { ListTasksQueryDto } from '../../../src/models/dto/query/listTasksQuery.dto.js';
import { CreateTaskDto } from '../../../src/models/dto/createTask.dto.js';
import { SysConfigService } from '../../../src/features/sysconfig/sysconfig.service.js';
import { SkillIdentificationService } from '../../../src/features/skillIdentification/skillIdentification.service.js';
import { SkillEntity } from '../../../src/models/entity/skill.entity.js';
import { TaskSkillMapperEntity } from '../../../src/models/entity/taskSkillMapper.entity.js';

const sysConfigService = { getInt: vi.fn() };
const skillIdentificationService = {
  identifyForTaskTree: vi.fn(async () => new Map()),
};

describe('TasksService.assignDeveloper', () => {
  let tasksService: TasksService;

  const manager = {
    findOne: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    create: vi.fn((_entity: unknown, values: unknown) => values),
    save: vi.fn(),
  };
  const tasksRepository = {
    manager: { transaction: vi.fn((callback) => callback(manager)) },
    findOne: vi.fn(),
  };

  const backendTask = Object.assign(new TaskEntity(), {
    taskId: '10',
    uuid: 'task-uuid',
    taskSkillMappers: [{ skillId: '2' }],
  });
  const frontendOnlyDeveloper = {
    developerId: '20',
    name: 'Alice',
    developerSkillMappers: [{ skillId: '1' }],
  };
  const backendDeveloper = {
    developerId: '21',
    name: 'Carol',
    developerSkillMappers: [{ skillId: '1' }, { skillId: '2' }],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    tasksRepository.findOne.mockResolvedValue(
      Object.assign(new TaskEntity(), {
        uuid: 'task-uuid',
        taskTitle: 'A task',
        taskDescription: null,
        status: 'T',
        version: 1,
        taskSkillMappers: [],
        taskMappers: [],
      }),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(TaskEntity), useValue: tasksRepository },
        { provide: SysConfigService, useValue: sysConfigService },
        {
          provide: SkillIdentificationService,
          useValue: skillIdentificationService,
        },
      ],
    }).compile();
    tasksService = moduleRef.get(TasksService);
  });

  it('throws UnprocessableEntityException when the developer lacks a required skill', async () => {
    manager.findOne
      .mockResolvedValueOnce(backendTask)
      .mockResolvedValueOnce(frontendOnlyDeveloper);

    await expect(
      tasksService.assignDeveloper('task-uuid', 'dev-uuid', 'Bob'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('replaces the assignment when the developer has every required skill', async () => {
    manager.findOne
      .mockResolvedValueOnce(backendTask)
      .mockResolvedValueOnce(backendDeveloper);

    await tasksService.assignDeveloper('task-uuid', 'dev-uuid', 'Bob');

    expect(manager.delete).toHaveBeenCalledWith(TaskMapperEntity, {
      taskId: '10',
    });
    expect(manager.create).toHaveBeenCalledWith(
      TaskMapperEntity,
      expect.objectContaining({
        taskId: '10',
        developerId: '21',
        createdBy: 'Bob',
        modifiedBy: 'Bob',
      }),
    );
    expect(manager.save).toHaveBeenCalledTimes(1);
  });

  it('removes the assignee when developerUuid is null', async () => {
    manager.findOne.mockResolvedValueOnce(backendTask);

    await tasksService.assignDeveloper('task-uuid', null, 'Bob');

    expect(manager.delete).toHaveBeenCalledWith(TaskMapperEntity, {
      taskId: '10',
    });
    expect(manager.update).toHaveBeenCalledWith(
      TaskEntity,
      { taskId: '10' },
      { modifiedBy: 'Bob' },
    );
    expect(manager.findOne).toHaveBeenCalledTimes(1);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundException and removes nothing when the task does not exist', async () => {
    manager.findOne.mockResolvedValueOnce(null);

    await expect(
      tasksService.assignDeveloper('missing-uuid', null, 'Bob'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.delete).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the developer does not exist', async () => {
    manager.findOne
      .mockResolvedValueOnce(backendTask)
      .mockResolvedValueOnce(null);

    await expect(
      tasksService.assignDeveloper('task-uuid', 'missing-uuid', 'Bob'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('TasksService.findAll', () => {
  let tasksService: TasksService;
  const tasksRepository = { findAndCount: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    tasksRepository.findAndCount.mockResolvedValue([[], 0]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(TaskEntity), useValue: tasksRepository },
        { provide: SysConfigService, useValue: sysConfigService },
        {
          provide: SkillIdentificationService,
          useValue: skillIdentificationService,
        },
      ],
    }).compile();
    tasksService = moduleRef.get(TasksService);
  });

  it('skips the previous pages and takes one page of tasks', async () => {
    const query = Object.assign(new ListTasksQueryDto(), {
      page: 3,
      pageSize: 20,
    });

    const result = await tasksService.findAll(query);

    expect(tasksRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 }),
    );
    expect(result).toEqual({ items: [], total: 0, page: 3, pageSize: 20 });
  });

  it('uses the defaults of page 1 and 50 tasks per page', () => {
    const query = new ListTasksQueryDto();

    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(50);
  });
});

describe('TasksService subtasks', () => {
  let tasksService: TasksService;
  let nextTaskId = 0;

  const manager = {
    findBy: vi.fn(),
    create: vi.fn((_entity: unknown, values: unknown) => values),
    save: vi.fn(),
  };
  const tasksRepository = {
    manager: { transaction: vi.fn((callback) => callback(manager)) },
    findOne: vi.fn(),
    find: vi.fn(),
    count: vi.fn(),
    merge: vi.fn(),
    save: vi.fn(),
  };

  function aTask(overrides: Partial<TaskEntity> = {}): TaskEntity {
    return Object.assign(new TaskEntity(), {
      taskId: '1',
      uuid: 'task-uuid',
      taskTitle: 'A task',
      taskDescription: null,
      status: 'T',
      version: 1,
      taskSkillMappers: [],
      taskMappers: [],
      parentTask: null,
      parentTaskId: null,
      ...overrides,
    });
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    nextTaskId = 0;
    sysConfigService.getInt.mockResolvedValue(5);
    skillIdentificationService.identifyForTaskTree.mockResolvedValue(new Map());
    manager.findBy.mockResolvedValue([]);
    manager.save.mockImplementation(async (value: unknown) =>
      Array.isArray(value)
        ? value
        : { ...(value as object), taskId: String(++nextTaskId) },
    );
    tasksRepository.findOne.mockResolvedValue(aTask());
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(TaskEntity), useValue: tasksRepository },
        { provide: SysConfigService, useValue: sysConfigService },
        {
          provide: SkillIdentificationService,
          useValue: skillIdentificationService,
        },
      ],
    }).compile();
    tasksService = moduleRef.get(TasksService);
  });

  it('refuses to mark a task Done while a subtask is not Done', async () => {
    tasksRepository.find.mockResolvedValue([{ status: 'D' }, { status: 'T' }]);

    await expect(
      tasksService.changeStatus('task-uuid', 'D', 'Bob'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(tasksRepository.save).not.toHaveBeenCalled();
  });

  it('marks a task Done when all its subtasks are Done', async () => {
    tasksRepository.find.mockResolvedValue([{ status: 'D' }, { status: 'D' }]);

    await tasksService.changeStatus('task-uuid', 'D', 'Bob');

    expect(tasksRepository.save).toHaveBeenCalledTimes(1);
  });

  it('saves a title change without looking at subtasks or the parent', async () => {
    await tasksService.update('task-uuid', { taskTitle: 'New title' }, 'Bob');

    expect(tasksRepository.find).not.toHaveBeenCalled();
    expect(tasksRepository.findOne).toHaveBeenCalledTimes(2);
  });

  it('does not check subtasks when the status is changed to In Progress', async () => {
    await tasksService.changeStatus('task-uuid', 'P', 'Bob');

    expect(tasksRepository.find).not.toHaveBeenCalled();
  });

  it('records who changed the status', async () => {
    tasksRepository.find.mockResolvedValue([]);

    await tasksService.changeStatus('task-uuid', 'D', 'Bob');

    expect(tasksRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'D', modifiedBy: 'Bob' }),
    );
  });

  it('refuses to delete a task that still has subtasks', async () => {
    tasksRepository.count.mockResolvedValue(2);

    await expect(
      tasksService.remove('task-uuid', 'Bob'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tasksRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('creates nested subtasks, each linked to its own parent', async () => {
    const dto: CreateTaskDto = {
      taskTitle: 'Parent',
      subtasks: [
        { taskTitle: 'Child 1' },
        { taskTitle: 'Child 2', subtasks: [{ taskTitle: 'Grandchild' }] },
      ],
    };

    await tasksService.create(dto, 'Bob');

    const createdTasks = manager.create.mock.calls
      .filter(([entity]) => entity === TaskEntity)
      .map(([, values]) => {
        const { taskTitle, parentTaskId } = values as CreateTaskDto & {
          parentTaskId: string | null;
        };
        return [taskTitle, parentTaskId];
      });
    expect(createdTasks).toEqual([
      ['Parent', null],
      ['Child 1', '1'],
      ['Child 2', '1'],
      ['Grandchild', '3'],
    ]);
  });

  it('refuses to create a Done task with a subtask that is not Done', async () => {
    const dto: CreateTaskDto = {
      taskTitle: 'Parent',
      status: 'D',
      subtasks: [{ taskTitle: 'Child' }],
    };

    await expect(tasksService.create(dto, 'Bob')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('refuses to create subtasks nested more than 5 levels deep', async () => {
    let dto: CreateTaskDto = { taskTitle: 'Level 6' };
    for (let level = 5; level >= 0; level--) {
      dto = { taskTitle: `Level ${level}`, subtasks: [dto] };
    }

    await expect(tasksService.create(dto, 'Bob')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tasksRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('refuses to move a subtask out of Done while its parent is Done', async () => {
    tasksRepository.findOne
      .mockResolvedValueOnce(aTask({ parentTaskId: '5' }))
      .mockResolvedValueOnce({ status: 'D' });

    await expect(
      tasksService.changeStatus('task-uuid', 'P', 'Bob'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(tasksRepository.save).not.toHaveBeenCalled();
  });

  it('moves a subtask out of Done when its parent is not Done', async () => {
    tasksRepository.findOne
      .mockResolvedValueOnce(aTask({ parentTaskId: '5' }))
      .mockResolvedValueOnce({ status: 'P' })
      .mockResolvedValue(aTask());

    await tasksService.changeStatus('task-uuid', 'P', 'Bob');

    expect(tasksRepository.save).toHaveBeenCalledTimes(1);
  });

  it('does not look up a parent for a task that has none', async () => {
    tasksRepository.findOne.mockResolvedValue(aTask({ parentTaskId: null }));

    await tasksService.changeStatus('task-uuid', 'P', 'Bob');

    expect(tasksRepository.findOne).toHaveBeenCalledTimes(2);
  });

  it('uses the nesting limit stored in sysconfig', async () => {
    sysConfigService.getInt.mockResolvedValue(1);
    const dto: CreateTaskDto = {
      taskTitle: 'Parent',
      subtasks: [
        { taskTitle: 'Child', subtasks: [{ taskTitle: 'Grandchild' }] },
      ],
    };

    await expect(tasksService.create(dto, 'Bob')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
  it('saves the skills the LLM identified for tasks sent without skills, as added by System', async () => {
    const child: CreateTaskDto = { taskTitle: 'Store audit logs' };
    const dto: CreateTaskDto = { taskTitle: 'Parent', subtasks: [child] };
    const backend = Object.assign(new SkillEntity(), { skillId: '2' });
    skillIdentificationService.identifyForTaskTree.mockResolvedValue(
      new Map([[child, [backend]]]),
    );

    await tasksService.create(dto, 'Bob');

    expect(skillIdentificationService.identifyForTaskTree).toHaveBeenCalledWith(
      dto,
    );
    const savedSkills = manager.create.mock.calls
      .filter(([entity]) => entity === TaskSkillMapperEntity)
      .map(([, values]) => values);
    expect(savedSkills).toEqual([
      { taskId: '2', skillId: '2', createdBy: 'System', modifiedBy: 'System' },
    ]);
  });

  it('keeps the skills the user chose, recorded as added by the user', async () => {
    const frontend = Object.assign(new SkillEntity(), {
      skillId: '1',
      uuid: 'frontend-uuid',
    });
    manager.findBy.mockResolvedValue([frontend]);

    await tasksService.create(
      { taskTitle: 'Homepage', skillUuids: ['frontend-uuid'] },
      'Bob',
    );

    const savedSkills = manager.create.mock.calls
      .filter(([entity]) => entity === TaskSkillMapperEntity)
      .map(([, values]) => values);
    expect(savedSkills).toEqual([
      { taskId: '1', skillId: '1', createdBy: 'Bob', modifiedBy: 'Bob' },
    ]);
  });
});
