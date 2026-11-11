import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  ParseUUIDPipe,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { UserActionGuard } from '../../shared/auth/userAction.guard.js';
import { CurrentUser } from '../../shared/auth/userCurrent.decorator.js';
import { CreateTaskDto } from '../../models/dto/request/createTask.dto.js';
import { UpdateTaskDto } from '../../models/dto/request/updateTask.dto.js';
import { AssignDeveloperDto } from '../../models/dto/request/assignDeveloper.dto.js';
import { TaskResponseDto } from '../../models/dto/response/taskResponse.dto.js';
import { ListTasksQueryDto } from '../../models/dto/query/listTasksQuery.dto.js';
import { PagedResponseDto } from '../../models/dto/response/pagedResponse.dto.js';
import { UpdateTaskStatus } from '../../models/dto/request/updateTaskStatus.dto.js';

@UseGuards(UserActionGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   *
   * @param createTaskDto   Created Task Details sent from frontend
   * @param currentUser     Current User who created the task
   * @returns               Created Task is returned to the frontend
   */

  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() currentUser: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(createTaskDto, currentUser);
  }

  /**
   *
   * @param id                Uuid of Task
   * @param UpdateTaskStatus  Updated Task Status for Task
   * @param currentUser       Current user who updates the status of the task
   * @returns                 Return the Updated Task with updated status to Frontend
   */

  @Put(':id/status')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() UpdateTaskStatus: UpdateTaskStatus,
    @CurrentUser() currentUser: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.changeStatus(
      id,
      UpdateTaskStatus.status,
      currentUser,
    );
  }

  /**
   *
   * @param id                  Uuid of Task
   * @param assignDeveloperDto  Developer to be assigned to the task
   * @param currentUser         Current User who assign the task
   * @returns                   Return the Updated Task with assigned developer to Frontend
   */

  @Put(':id/assignee')
  assignDeveloper(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDeveloperDto: AssignDeveloperDto,
    @CurrentUser() currentUser: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.assignDeveloper(
      id,
      assignDeveloperDto.developerUuid,
      currentUser,
    );
  }

  /**
   *
   * @param id           UUID of the Task in the Database
   * @param currentUser  User that deletes the task
   */
  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: string,
  ): Promise<void> {
    await this.tasksService.remove(id, currentUser);
  }

  /** Get a list of task in the database in pagination form
   *
   * @param query  Filters params passed by the Frontend
   * @returns      List of Task with Pagination
   */
  @Get()
  findAll(
    @Query() query: ListTasksQueryDto,
  ): Promise<PagedResponseDto<TaskResponseDto>> {
    return this.tasksService.findAll(query);
  }

  /** Get a single task based on uuid
   *
   * @param query  Filters params passed by the Frontend
   * @returns      List of Task with Pagination
   */

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto> {
    return this.tasksService.findOne(id);
  }

  /**
   *
   * @param id              Uuid of Task  
   * @param updateTaskDto   Updated Task sent from Frontend to be updated
   * @param currentUser     Current user who updates the task
   * @returns               Return the Updated Task with updated task details to Frontend
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() currentUser: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(id, updateTaskDto, currentUser);
  }
}
