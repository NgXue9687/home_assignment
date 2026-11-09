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
import { CreateTaskDto } from '../../models/dto/createTask.dto.js';
import { UpdateTaskDto } from '../../models/dto/updateTask.dto.js';
import { AssignDeveloperDto } from '../../models/dto/assignDeveloper.dto.js';
import { TaskResponseDto } from '../../models/dto/response/taskResponse.dto.js';
import { ListTasksQueryDto } from '../../models/dto/query/listTasksQuery.dto.js';
import { PagedResponseDto } from '../../models/dto/response/pagedResponse.dto.js';
import { UpdateTaskStatus } from '../../models/dto/updateTaskStatus.dto.js';

@UseGuards(UserActionGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() currentUser: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(createTaskDto, currentUser);
  }
  @Get()
  findAll(
    @Query() query: ListTasksQueryDto,
  ): Promise<PagedResponseDto<TaskResponseDto>> {
    return this.tasksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto> {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() currentUser: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(id, updateTaskDto, currentUser);
  }

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

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: string,
  ): Promise<void> {
    await this.tasksService.remove(id, currentUser);
  }
}
