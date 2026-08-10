import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  @Post('events')
  create(@CurrentUser() user: any, @Body() createEventDto: CreateEventDto) {
    return this.calendarService.create(user.org_id, user.id, createEventDto);
  }

  @Get('events')
  findAll(
    @CurrentUser() user: any,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('type') type?: string,
  ) {
    return this.calendarService.findAll(user.org_id, user.id, start_date, end_date, type);
  }

  @Get('events/my')
  getUserEvents(
    @CurrentUser() user: any,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.calendarService.getUserEvents(user.org_id, user.id, start_date, end_date);
  }

  @Get('events/:id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.calendarService.findOne(id, user.org_id, user.id);
  }

  @Put('events/:id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateData: any) {
    return this.calendarService.update(id, user.org_id, user.id, updateData);
  }

  @Delete('events/:id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.calendarService.remove(id, user.org_id, user.id);
  }
}
