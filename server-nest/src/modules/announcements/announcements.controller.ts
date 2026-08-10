import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnnouncementsService } from './announcements.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createDto: CreateAnnouncementDto) {
    return this.announcementsService.create(user.org_id, user.id, createDto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.announcementsService.findAll(user.org_id, filters);
  }

  @Get('pinned')
  getPinned(@CurrentUser() user: any) {
    return this.announcementsService.getPinned(user.org_id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.announcementsService.findOne(id, user.org_id);
  }

  @Put(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateDto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, user.org_id, updateDto);
  }

  @Patch(':id/toggle-pin')
  togglePin(@CurrentUser() user: any, @Param('id') id: string) {
    return this.announcementsService.togglePin(id, user.org_id);
  }

  @Post(':id/pin')
  pin(@CurrentUser() user: any, @Param('id') id: string) {
    return this.announcementsService.setPinStatus(id, user.org_id, true);
  }

  @Post(':id/unpin')
  unpin(@CurrentUser() user: any, @Param('id') id: string) {
    return this.announcementsService.setPinStatus(id, user.org_id, false);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.announcementsService.remove(id, user.org_id);
  }
}
