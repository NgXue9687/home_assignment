import { Test } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TasksController } from '../../../src/features/tasks/tasks.controller.js';
import { TasksService } from '../../../src/features/tasks/tasks.service.js';

const taskUuid = '3f2b8c1e-5d4a-4b6e-9c7d-1a2b3c4d5e6f';
const developerUuid = '8a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

describe('TasksController', () => {
  let app: INestApplication;
  const tasksService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    changeStatus: vi.fn(),
    assignDeveloper: vi.fn(),
    remove: vi.fn(),
  };

  // The same pipe options as main.ts, so a request is validated the way it is for real.
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: tasksService }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    for (const method of Object.values(tasksService)) {
      method.mockResolvedValue({ ok: true });
    }
  });

  const asBob = (test: request.Test) => test.set('x-acting-user', 'Bob');

  describe('every route', () => {
    it('answers 401 when the x-acting-user header is missing', async () => {
      await request(app.getHttpServer()).get('/tasks').expect(401);
      expect(tasksService.findAll).not.toHaveBeenCalled();
    });

    it('answers 400 when the id is not a uuid', async () => {
      await asBob(request(app.getHttpServer()).get('/tasks/not-a-uuid')).expect(
        400,
      );
    });
  });

  describe('GET /tasks', () => {
    it('uses page 1 and 50 tasks per page by default', async () => {
      await asBob(request(app.getHttpServer()).get('/tasks')).expect(200);

      expect(tasksService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 50 }),
      );
    });

    it('turns the query string into numbers', async () => {
      await asBob(
        request(app.getHttpServer()).get('/tasks?page=2&pageSize=10'),
      ).expect(200);

      expect(tasksService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, pageSize: 10 }),
      );
    });

    it.each(['page=0', 'pageSize=101', 'pageSize=abc'])(
      'answers 400 for %s',
      async (query) => {
        await asBob(request(app.getHttpServer()).get(`/tasks?${query}`)).expect(
          400,
        );
        expect(tasksService.findAll).not.toHaveBeenCalled();
      },
    );
  });

  describe('PATCH /tasks/:id', () => {
    it('changes the title and passes the acting user', async () => {
      await asBob(
        request(app.getHttpServer())
          .patch(`/tasks/${taskUuid}`)
          .send({ taskTitle: 'New' }),
      ).expect(200);

      expect(tasksService.update).toHaveBeenCalledWith(
        taskUuid,
        { taskTitle: 'New' },
        'Bob',
      );
    });

    it('rejects a status, which has its own endpoint', async () => {
      await asBob(
        request(app.getHttpServer())
          .patch(`/tasks/${taskUuid}`)
          .send({ status: 'D' }),
      ).expect(400);

      expect(tasksService.update).not.toHaveBeenCalled();
    });
  });

  describe('PUT /tasks/:id/status', () => {
    it('passes the status and the acting user', async () => {
      await asBob(
        request(app.getHttpServer())
          .put(`/tasks/${taskUuid}/status`)
          .send({ status: 'D' }),
      ).expect(200);

      expect(tasksService.changeStatus).toHaveBeenCalledWith(
        taskUuid,
        'D',
        'Bob',
      );
    });

    it.each([{}, { status: 'X' }, { status: 'D', taskTitle: 'sneaky' }])(
      'answers 400 for %j',
      async (body) => {
        await asBob(
          request(app.getHttpServer())
            .put(`/tasks/${taskUuid}/status`)
            .send(body),
        ).expect(400);

        expect(tasksService.changeStatus).not.toHaveBeenCalled();
      },
    );
  });

  describe('PUT /tasks/:id/assignee', () => {
    it('assigns the developer', async () => {
      await asBob(
        request(app.getHttpServer())
          .put(`/tasks/${taskUuid}/assignee`)
          .send({ developerUuid }),
      ).expect(200);

      expect(tasksService.assignDeveloper).toHaveBeenCalledWith(
        taskUuid,
        developerUuid,
        'Bob',
      );
    });

    it.each([null, ''])(
      'removes the assignee when developerUuid is %j',
      async (value) => {
        await asBob(
          request(app.getHttpServer())
            .put(`/tasks/${taskUuid}/assignee`)
            .send({ developerUuid: value }),
        ).expect(200);

        expect(tasksService.assignDeveloper).toHaveBeenCalledWith(
          taskUuid,
          null,
          'Bob',
        );
      },
    );

    it.each([{}, { developerUuid: 'not-a-uuid' }])(
      'answers 400 for %j',
      async (body) => {
        await asBob(
          request(app.getHttpServer())
            .put(`/tasks/${taskUuid}/assignee`)
            .send(body),
        ).expect(400);

        expect(tasksService.assignDeveloper).not.toHaveBeenCalled();
      },
    );
  });

  describe('DELETE /tasks/:id', () => {
    it('answers 204 and passes the acting user', async () => {
      tasksService.remove.mockResolvedValue(undefined);

      await asBob(
        request(app.getHttpServer()).delete(`/tasks/${taskUuid}`),
      ).expect(204);

      expect(tasksService.remove).toHaveBeenCalledWith(taskUuid, 'Bob');
    });
  });
});
