import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Announcement } from '../../entities/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { EventsGateway } from '../../common/gateways/events.gateway';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    private eventsGateway: EventsGateway,
  ) {}

  async create(org_id: string, author_id: string, createDto: CreateAnnouncementDto) {
    const announcement = this.announcementRepository.create({
      id: randomUUID(),
      org_id,
      author_id,
      ...createDto,
      is_pinned: false,
    });

    await this.announcementRepository.save(announcement);

    // Send real-time notification to all users in organization
    this.eventsGateway.sendToOrganization(org_id, 'announcement:new', announcement);

    return { success: true, data: announcement };
  }

  async findAll(org_id: string, filters?: any) {
    const query = this.announcementRepository.createQueryBuilder('announcement')
      .where('announcement.org_id = :org_id', { org_id });

    if (filters?.priority) {
      query.andWhere('announcement.priority = :priority', { priority: filters.priority });
    }

    if (filters?.is_pinned !== undefined) {
      query.andWhere('announcement.is_pinned = :is_pinned', { is_pinned: filters.is_pinned });
    }

    // Pinned announcements first, then by creation date
    query.orderBy('announcement.is_pinned', 'DESC')
      .addOrderBy('announcement.created_at', 'DESC');

    const announcements = await query.getMany();
    return { success: true, data: announcements };
  }

  async findOne(id: string, org_id: string) {
    const announcement = await this.announcementRepository.findOne({
      where: { id, org_id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return { success: true, data: announcement };
  }

  async update(id: string, org_id: string, updateDto: UpdateAnnouncementDto) {
    const announcement = await this.announcementRepository.findOne({
      where: { id, org_id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    Object.assign(announcement, updateDto);
    await this.announcementRepository.save(announcement);

    // Send real-time update
    this.eventsGateway.sendToOrganization(org_id, 'announcement:updated', announcement);

    return { success: true, data: announcement };
  }

  async togglePin(id: string, org_id: string) {
    const announcement = await this.announcementRepository.findOne({
      where: { id, org_id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    announcement.is_pinned = !announcement.is_pinned;
    await this.announcementRepository.save(announcement);

    // Send real-time update
    this.eventsGateway.sendToOrganization(org_id, 'announcement:updated', announcement);

    return { success: true, data: announcement };
  }

  async setPinStatus(id: string, org_id: string, isPinned: boolean) {
    const announcement = await this.announcementRepository.findOne({
      where: { id, org_id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    announcement.is_pinned = isPinned;
    await this.announcementRepository.save(announcement);
    this.eventsGateway.sendToOrganization(org_id, 'announcement:updated', announcement);

    return { success: true, data: announcement };
  }

  async remove(id: string, org_id: string) {
    const announcement = await this.announcementRepository.findOne({
      where: { id, org_id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    await this.announcementRepository.remove(announcement);

    // Send real-time deletion notification
    this.eventsGateway.sendToOrganization(org_id, 'announcement:deleted', { id });

    return { success: true, message: 'Announcement deleted successfully' };
  }

  async getPinned(org_id: string) {
    const pinned = await this.announcementRepository.find({
      where: { org_id, is_pinned: true },
      order: { created_at: 'DESC' },
    });

    return { success: true, data: pinned };
  }
}
