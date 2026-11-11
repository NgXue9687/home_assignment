import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { DevelopersService } from './developers.service.js';
import { UserActionGuard } from '../../shared/auth/userAction.guard.js';
import { DeveloperResponseDto } from '../../models/dto/response/developerResponse.dto.js';

@UseGuards(UserActionGuard)
@Controller('developers')
export class DevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  /**
   *
   * @returns List of all developers from the database
   */
  @Get()
  findAll(): Promise<DeveloperResponseDto[]> {
    return this.developersService.findAll();
  }

  /**
   *
   * @param id  Uuid of the developer
   * @returns   a single developer record from the database
   */

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeveloperResponseDto> {
    return this.developersService.findOne(id);
  }
}
