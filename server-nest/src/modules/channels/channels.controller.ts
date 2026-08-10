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
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessagesService } from '../messages/messages.service';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(
    private channelsService: ChannelsService,
    private messagesService: MessagesService,
  ) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createChannelDto: CreateChannelDto) {
    return this.channelsService.create(user.org_id, user.id, createChannelDto);
  }

  /** Find or create a 1:1 direct message channel with another user. */
  @Post('direct')
  openDirect(@CurrentUser() user: any, @Body() body: { user_id: string }) {
    return this.channelsService.findOrCreateDirect(user.org_id, user.id, body.user_id);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.channelsService.findAll(user.org_id, user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.channelsService.findOne(id, user.org_id, user.id);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateData: any) {
    return this.channelsService.update(id, user.org_id, user.id, updateData);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.channelsService.remove(id, user.org_id, user.id);
  }

  // Members
  @Post(':id/members')
  addMembers(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { member_ids: string[] },
  ) {
    return this.channelsService.addMembers(id, user.org_id, user.id, body.member_ids);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.channelsService.removeMember(id, user.org_id, user.id, userId);
  }

  @Put(':id/read')
  markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.channelsService.updateLastRead(id, user.id);
  }

  @Get(':id/messages')
  getChannelMessages(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.messagesService.findAll(id, user.id, limit, before);
  }

  @Post(':id/messages')
  postChannelMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { content: string; parent_message_id?: string; mentions?: string[] },
  ) {
    return this.messagesService.create(user.id, {
      channel_id: id,
      content: body.content,
      parent_message_id: body.parent_message_id,
      mentions: body.mentions,
    });
  }
}
