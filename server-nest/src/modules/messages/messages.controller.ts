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
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(user.id, createMessageDto);
  }

  @Get('channel/:channelId')
  findAll(
    @CurrentUser() user: any,
    @Param('channelId') channelId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.messagesService.findAll(channelId, user.id, limit, before);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.messagesService.findOne(id, user.id);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { content: string }) {
    return this.messagesService.update(id, user.id, body.content);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.messagesService.remove(id, user.id);
  }

  // Reactions
  @Post(':id/reactions')
  addReaction(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { emoji: string },
  ) {
    return this.messagesService.addReaction(id, user.id, body.emoji);
  }

  @Delete(':id/reactions/:emoji')
  removeReaction(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('emoji') emoji: string,
  ) {
    return this.messagesService.removeReaction(id, user.id, emoji);
  }

  // Threads
  @Get(':id/thread')
  getThread(@CurrentUser() user: any, @Param('id') id: string) {
    return this.messagesService.getThread(id, user.id);
  }

  // Search
  @Get('channel/:channelId/search')
  search(
    @CurrentUser() user: any,
    @Param('channelId') channelId: string,
    @Query('q') query: string,
  ) {
    return this.messagesService.search(channelId, user.id, query);
  }
}
