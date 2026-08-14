import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Message } from '../../entities/message.entity';
import { Channel } from '../../entities/channel.entity';
import { ChannelMember } from '../../entities/channel-member.entity';
import { User } from '../../entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private channelMembersRepository: Repository<ChannelMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
  ) {}

  private formatMessage(message: Message, user?: User | null) {
    const first = user?.first_name || '';
    const last = user?.last_name || '';
    const name = `${first} ${last}`.trim() || user?.email || 'User';
    return {
      id: message.id,
      channel_id: message.channel_id,
      channelId: message.channel_id,
      user_id: message.user_id,
      userId: message.user_id,
      sender_id: message.user_id,
      content: message.content,
      parent_message_id: message.parent_message_id,
      attachments: message.attachments,
      mentions: message.mentions,
      reactions: message.reactions,
      is_edited: message.is_edited,
      is_deleted: message.is_deleted,
      created_at: message.created_at,
      createdAt: message.created_at,
      updated_at: message.updated_at,
      user_first_name: user?.first_name || null,
      user_last_name: user?.last_name || null,
      user_avatar: user?.avatar || null,
      user_name: name,
      user: user
        ? {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar: user.avatar,
          }
        : undefined,
    };
  }
  async create(user_id: string, createMessageDto: CreateMessageDto) {
    const { channel_id } = createMessageDto;

    // Verify channel exists
    const channel = await this.channelsRepository.findOne({
      where: { id: channel_id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Verify user is member of channel
    let membership = await this.channelMembersRepository.findOne({
      where: { channel_id, user_id },
    });

    if (!membership && channel.type === 'private') {
      throw new ForbiddenException('You are not a member of this channel');
    }

    // Auto-join public channels on first message
    if (!membership && channel.type === 'public') {
      membership = this.channelMembersRepository.create({
        id: randomUUID(),
        channel_id,
        user_id,
        role: 'member',
      });
      await this.channelMembersRepository.save(membership);
    }

    // Create message
    const message = this.messagesRepository.create({
      id: randomUUID(),
      user_id,
      ...createMessageDto,
    });

    await this.messagesRepository.save(message);

    // Get message with user details
    const messageWithUser = await this.getMessageWithUser(message.id);

    // Send real-time update
    this.eventsGateway.sendMessageToChannel(channel_id, messageWithUser);

    // Send notifications to mentioned users
    if (createMessageDto.mentions && createMessageDto.mentions.length > 0) {
      await this.notifyMentionedUsers(
        createMessageDto.mentions,
        user_id,
        channel_id,
        message.content,
        channel.org_id,
      );
    }

    // Notify other channel members
    const allMembers = await this.channelMembersRepository.find({ where: { channel_id } });
    const otherMembers = allMembers.filter(m => m.user_id !== user_id && !(createMessageDto.mentions || []).includes(m.user_id));
    
    for (const member of otherMembers) {
      await this.notificationsService.notifyNewMessage(
        channel_id,
        channel.name || 'a channel',
        messageWithUser?.user_name || 'Someone',
        message.content.substring(0, 100),
        member.user_id,
        channel.org_id
      );
    }

    return {
      success: true,
      data: messageWithUser,
    };
  }

  async findAll(channel_id: string, user_id: string, limit: number = 50, before?: string) {
    const channel = await this.channelsRepository.findOne({
      where: { id: channel_id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const membership = await this.channelMembersRepository.findOne({
      where: { channel_id, user_id },
    });

    if (!membership && channel.type === 'private') {
      throw new ForbiddenException('You do not have access to this channel');
    }

    const where: any = { channel_id, is_deleted: false, parent_message_id: IsNull() };
    if (before) {
      where.created_at = LessThan(new Date(before));
    }

    const messages = await this.messagesRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: limit,
    });

    const userIds = [...new Set(messages.map((m) => m.user_id).filter(Boolean))];
    const users = userIds.length
      ? await this.usersRepository.find({ where: { id: In(userIds) } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const messagesWithThreads = await Promise.all(
      messages.map(async (msg) => {
        const threadCount = await this.messagesRepository.count({
          where: { parent_message_id: msg.id, is_deleted: false },
        });
        return {
          ...this.formatMessage(msg, userMap.get(msg.user_id)),
          thread_count: threadCount,
        };
      }),
    );

    return {
      success: true,
      data: messagesWithThreads.reverse(),
    };
  }

  async findOne(id: string, user_id: string) {
    const message = await this.getMessageWithUser(id);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user has access
    const channel = await this.channelsRepository.findOne({
      where: { id: message.channel_id },
    });

    const membership = await this.channelMembersRepository.findOne({
      where: { channel_id: message.channel_id, user_id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (!membership && channel.type === 'private') {
      throw new ForbiddenException('You do not have access to this message');
    }

    return {
      success: true,
      data: message,
    };
  }

  async update(id: string, user_id: string, content: string) {
    const message = await this.messagesRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.user_id !== user_id) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    message.content = content;
    message.is_edited = true;
    message.edited_at = new Date();

    await this.messagesRepository.save(message);

    const updatedMessage = await this.getMessageWithUser(id);

    // Send real-time update
    this.eventsGateway.sendMessageToChannel(message.channel_id, {
      ...updatedMessage,
      event: 'messageUpdated',
    });

    return {
      success: true,
      data: updatedMessage,
    };
  }

  async remove(id: string, user_id: string) {
    const message = await this.messagesRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is message author or channel admin
    const membership = await this.channelMembersRepository.findOne({
      where: { channel_id: message.channel_id, user_id },
    });

    if (message.user_id !== user_id && (!membership || membership.role !== 'admin')) {
      throw new ForbiddenException('You do not have permission to delete this message');
    }

    message.is_deleted = true;
    await this.messagesRepository.save(message);

    // Send real-time update
    this.eventsGateway.sendMessageToChannel(message.channel_id, {
      id: message.id,
      event: 'messageDeleted',
    });

    return {
      success: true,
      message: 'Message deleted successfully',
    };
  }

  // Reactions
  async addReaction(message_id: string, user_id: string, emoji: string) {
    const message = await this.messagesRepository.findOne({
      where: { id: message_id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Initialize reactions if null
    if (!message.reactions) {
      message.reactions = {};
    }

    // Add user to emoji reactions
    if (!message.reactions[emoji]) {
      message.reactions[emoji] = [];
    }

    if (!message.reactions[emoji].includes(user_id)) {
      message.reactions[emoji].push(user_id);
    }

    await this.messagesRepository.save(message);

    // Send real-time update
    this.eventsGateway.sendMessageToChannel(message.channel_id, {
      message_id,
      emoji,
      user_id,
      reactions: message.reactions,
      event: 'reactionAdded',
    });

    return {
      success: true,
      data: { reactions: message.reactions },
    };
  }

  async removeReaction(message_id: string, user_id: string, emoji: string) {
    const message = await this.messagesRepository.findOne({
      where: { id: message_id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.reactions && message.reactions[emoji]) {
      message.reactions[emoji] = message.reactions[emoji].filter((id) => id !== user_id);

      if (message.reactions[emoji].length === 0) {
        delete message.reactions[emoji];
      }
    }

    await this.messagesRepository.save(message);

    // Send real-time update
    this.eventsGateway.sendMessageToChannel(message.channel_id, {
      message_id,
      emoji,
      user_id,
      reactions: message.reactions,
      event: 'reactionRemoved',
    });

    return {
      success: true,
      data: { reactions: message.reactions },
    };
  }

  // Threads
  async getThread(parent_message_id: string, user_id: string) {
    const parentMessage = await this.messagesRepository.findOne({
      where: { id: parent_message_id },
    });

    if (!parentMessage) {
      throw new NotFoundException('Parent message not found');
    }

    // Verify access
    const channel = await this.channelsRepository.findOne({
      where: { id: parentMessage.channel_id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const membership = await this.channelMembersRepository.findOne({
      where: { channel_id: parentMessage.channel_id, user_id },
    });

    if (!membership && channel.type === 'private') {
      throw new ForbiddenException('You do not have access to this thread');
    }

    const replies = await this.messagesRepository.find({
      where: { parent_message_id, is_deleted: false },
      order: { created_at: 'ASC' },
    });
    const userIds = [...new Set(replies.map((m) => m.user_id).filter(Boolean))];
    const users = userIds.length
      ? await this.usersRepository.find({ where: { id: In(userIds) } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      success: true,
      data: replies.map((m) => this.formatMessage(m, userMap.get(m.user_id))),
    };
  }

  // Search messages
  async search(channel_id: string, user_id: string, query: string) {
    // Verify access
    const channel = await this.channelsRepository.findOne({
      where: { id: channel_id },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const membership = await this.channelMembersRepository.findOne({
      where: { channel_id, user_id },
    });

    if (!membership && channel.type === 'private') {
      throw new ForbiddenException('You do not have access to this channel');
    }

    const messages = await this.messagesRepository
      .createQueryBuilder('message')
      .where('message.channel_id = :channel_id', { channel_id })
      .andWhere('message.content LIKE :query', { query: `%${query}%` })
      .andWhere('message.is_deleted = :is_deleted', { is_deleted: false })
      .orderBy('message.created_at', 'DESC')
      .limit(50)
      .getMany();

    const userIds = [...new Set(messages.map((m) => m.user_id).filter(Boolean))];
    const users = userIds.length
      ? await this.usersRepository.find({ where: { id: In(userIds) } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      success: true,
      data: messages.map((m) => this.formatMessage(m, userMap.get(m.user_id))),
    };
  }

  // Helper methods
  private async getMessageWithUser(message_id: string) {
    const message = await this.messagesRepository.findOne({ where: { id: message_id } });
    if (!message) return null;
    const user = await this.usersRepository.findOne({ where: { id: message.user_id } });
    return this.formatMessage(message, user);
  }

  private async notifyMentionedUsers(
    mention_ids: string[],
    sender_id: string,
    channel_id: string,
    content: string,
    org_id: string,
  ) {
    const sender = await this.usersRepository.findOne({ where: { id: sender_id } });
    const channel = await this.channelsRepository.findOne({ where: { id: channel_id } });

    for (const userId of mention_ids) {
      await this.notificationsService.notifyMention(
        sender_id,
        userId,
        channel_id,
        content.substring(0, 100),
        org_id
      );
    }
  }
}
