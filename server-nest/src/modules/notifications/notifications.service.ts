import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { EmailService } from '../../common/services/email.service';

export interface CreateNotificationDto {
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
  send_email?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private eventsGateway: EventsGateway,
    private emailService: EmailService,
  ) {}

  async create(org_id: string, createDto: CreateNotificationDto) {
    const notification = this.notificationsRepository.create({
      id: randomUUID(),
      org_id,
      user_id: createDto.user_id,
      type: createDto.type,
      title: createDto.title,
      message: createDto.message,
      link: createDto.link,
      metadata: createDto.metadata,
      read: false,
    });

    await this.notificationsRepository.save(notification);

    // Send real-time notification
    this.eventsGateway.sendNotificationToUser(createDto.user_id, notification);

    // Send email if requested
    if (createDto.send_email) {
      const user = await this.usersRepository.findOne({ where: { id: createDto.user_id } });
      if (user && user.email) {
        await this.emailService.sendNotificationEmail(
          user.email,
          createDto.title,
          createDto.message,
        );
      }
    }

    return {
      success: true,
      data: notification,
    };
  }

  async findAll(user_id: string, filters?: { read?: boolean; type?: string }) {
    const where: any = { user_id };

    if (filters?.read !== undefined) {
      where.read = filters.read;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    const notifications = await this.notificationsRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: 100,
    });

    return {
      success: true,
      data: notifications,
    };
  }

  async getUnreadCount(user_id: string) {
    const count = await this.notificationsRepository.count({
      where: { user_id, read: false },
    });

    return {
      success: true,
      data: { count },
    };
  }

  async markAsRead(id: string, user_id: string) {
    const notification = await this.notificationsRepository.findOne({
      where: { id, user_id },
    });

    if (notification) {
      notification.read = true;
      await this.notificationsRepository.save(notification);
    }

    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  async markAllAsRead(user_id: string) {
    await this.notificationsRepository.update(
      { user_id, read: false },
      { read: true },
    );

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  async remove(id: string, user_id: string) {
    await this.notificationsRepository.delete({ id, user_id });

    return {
      success: true,
      message: 'Notification deleted',
    };
  }

  // Helper method to create specific notification types
  async notifyTaskAssigned(task_id: string, task_title: string, assignee_id: string, project_name: string, org_id: string) {
    return this.create(org_id, {
      user_id: assignee_id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned to task: ${task_title} in ${project_name}`,
      link: `/tasks/${task_id}`,
      metadata: { task_id, project_name },
      send_email: true,
    });
  }

  async notifyMeetingInvite(meeting_id: string, meeting_title: string, participant_id: string, start_time: string, org_id: string) {
    return this.create(org_id, {
      user_id: participant_id,
      type: 'meeting_invite',
      title: 'Meeting Invitation',
      message: `You've been invited to: ${meeting_title} at ${start_time}`,
      link: `/meetings/${meeting_id}`,
      metadata: { meeting_id, start_time },
      send_email: true,
    });
  }

  async notifyMention(mentioning_user_id: string, mentioned_user_id: string, channel_id: string, message_preview: string, org_id: string) {
    const user = await this.usersRepository.findOne({ where: { id: mentioning_user_id } });
    const userName = user ? `${user.first_name} ${user.last_name}` : 'Someone';

    return this.create(org_id, {
      user_id: mentioned_user_id,
      type: 'mention',
      title: 'You were mentioned',
      message: `${userName} mentioned you: ${message_preview}`,
      link: `/channels/${channel_id}`,
      metadata: { channel_id, mentioning_user_id },
    });
  }

  async notifyDeadlineApproaching(task_id: string, task_title: string, assignee_id: string, due_date: string, org_id: string) {
    return this.create(org_id, {
      user_id: assignee_id,
      type: 'deadline_approaching',
      title: 'Deadline Approaching',
      message: `Task "${task_title}" is due on ${due_date}`,
      link: `/tasks/${task_id}`,
      metadata: { task_id, due_date },
      send_email: true,
    });
  }
  async notifyTaskStatusChanged(task_id: string, task_title: string, user_id: string, new_status: string, project_name: string, org_id: string) {
    return this.create(org_id, {
      user_id,
      type: 'task_status_changed',
      title: 'Task Status Updated',
      message: `Task "${task_title}" in ${project_name} was moved to ${new_status}`,
      link: `/tasks/${task_id}`,
      metadata: { task_id, project_name, new_status },
    });
  }

  async notifyProjectInvite(project_id: string, project_name: string, user_id: string, inviter_name: string, org_id: string) {
    return this.create(org_id, {
      user_id,
      type: 'project_invite',
      title: 'Added to Project',
      message: `${inviter_name} added you to the project: ${project_name}`,
      link: `/projects/${project_id}`,
      metadata: { project_id, inviter_name },
      send_email: true,
    });
  }

  async notifyNewMessage(channel_id: string, channel_name: string, sender_name: string, message_preview: string, recipient_id: string, org_id: string) {
    return this.create(org_id, {
      user_id: recipient_id,
      type: 'new_message',
      title: `New Message in ${channel_name}`,
      message: `${sender_name}: ${message_preview}`,
      link: `/messages/${channel_id}`,
      metadata: { channel_id },
    });
  }
}
