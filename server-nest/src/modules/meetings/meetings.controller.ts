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
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(private meetingsService: MeetingsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createMeetingDto: CreateMeetingDto) {
    return this.meetingsService.create(user.org_id, user, createMeetingDto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.meetingsService.findAll(user.org_id, user, filters);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.meetingsService.findOne(id, user.org_id, user);
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateMeetingDto: UpdateMeetingDto,
  ) {
    return this.meetingsService.update(id, user.org_id, updateMeetingDto, user);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.meetingsService.remove(id, user.org_id, user);
  }

  // Participants
  @Post(':id/participants')
  addParticipants(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { participant_ids: string[] },
  ) {
    return this.meetingsService.addParticipants(id, user.org_id, body.participant_ids);
  }

  @Delete(':id/participants/:userId')
  removeParticipant(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.meetingsService.removeParticipant(id, user.org_id, userId);
  }

  @Put(':id/participants/:userId/status')
  updateParticipantStatus(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { status: 'accepted' | 'declined' },
  ) {
    return this.meetingsService.updateParticipantStatus(id, userId, body.status);
  }

  // Action Items
  @Post(':id/action-items')
  createActionItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() createActionItemDto: CreateActionItemDto,
  ) {
    return this.meetingsService.createActionItem(id, user.org_id, createActionItemDto);
  }

  @Get(':id/action-items')
  getActionItems(@CurrentUser() user: any, @Param('id') id: string) {
    return this.meetingsService.getActionItems(id, user.org_id);
  }

  @Put(':id/action-items/:actionItemId')
  updateActionItem(
    @Param('id') id: string,
    @Param('actionItemId') actionItemId: string,
    @Body() updateData: any,
  ) {
    return this.meetingsService.updateActionItem(actionItemId, id, updateData);
  }

  @Put('action-items/:id')
  updateActionItemById(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    return this.meetingsService.updateActionItemById(id, user.org_id, updateData);
  }

  @Delete(':id/action-items/:actionItemId')
  deleteActionItem(@Param('id') id: string, @Param('actionItemId') actionItemId: string) {
    return this.meetingsService.deleteActionItem(actionItemId, id);
  }
}
