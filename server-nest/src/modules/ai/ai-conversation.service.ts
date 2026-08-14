import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AiConversation } from '../../entities/ai-conversation.entity';
import { AiMessage } from '../../entities/ai-message.entity';
import { AiUsage } from '../../entities/ai-usage.entity';
import { CreateConversationDto, UpdateConversationDto, SendMessageDto, UpdateMessageDto } from './dto/conversation.dto';

// Usage limits per user per month
const USAGE_LIMITS = {
  ceo: { messages: 1000, conversations: 100 },
  cto: { messages: 1000, conversations: 100 },
  ciso: { messages: 500, conversations: 50 },
  finance: { messages: 500, conversations: 50 },
  software_engineer: { messages: 300, conversations: 30 },
  ui_ux_designer: { messages: 300, conversations: 30 },
  customer_support: { messages: 200, conversations: 20 },
  default: { messages: 200, conversations: 20 },
};

@Injectable()
export class AiConversationService {
  constructor(
    @InjectRepository(AiConversation)
    private conversationRepository: Repository<AiConversation>,
    @InjectRepository(AiMessage)
    private messageRepository: Repository<AiMessage>,
    @InjectRepository(AiUsage)
    private usageRepository: Repository<AiUsage>,
  ) {}

  // Check usage limits
  async checkUsageLimits(userId: string, userRole: string, type: 'message' | 'conversation'): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let usage = await this.usageRepository.findOne({
      where: {
        userId,
        periodStart,
      },
    });

    if (!usage) {
      usage = this.usageRepository.create({
        userId,
        orgId: '', // Will be set by caller
        periodStart,
        periodEnd,
        messagesSent: 0,
        conversationsCreated: 0,
        tokensUsed: 0,
      });
      await this.usageRepository.save(usage);
    }

    const limits = USAGE_LIMITS[userRole?.toLowerCase().replace(/\s+/g, '_')] || USAGE_LIMITS.default;

    if (type === 'message' && usage.messagesSent >= limits.messages) {
      throw new ForbiddenException(
        `Monthly message limit reached (${limits.messages}). Please contact your administrator to increase your limit.`
      );
    }

    if (type === 'conversation' && usage.conversationsCreated >= limits.conversations) {
      throw new ForbiddenException(
        `Monthly conversation limit reached (${limits.conversations}). Please contact your administrator to increase your limit.`
      );
    }
  }

  // Increment usage counters
  async incrementUsage(userId: string, type: 'message' | 'conversation', tokens: number = 0): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let usage = await this.usageRepository.findOne({
      where: {
        userId,
        periodStart: Between(periodStart, periodEnd),
      },
    });

    if (!usage) {
      usage = this.usageRepository.create({
        userId,
        orgId: '',
        periodStart,
        periodEnd,
        messagesSent: 0,
        conversationsCreated: 0,
        tokensUsed: 0,
      });
    }

    if (type === 'message') {
      usage.messagesSent += 1;
      usage.tokensUsed += tokens;
    } else if (type === 'conversation') {
      usage.conversationsCreated += 1;
    }

    await this.usageRepository.save(usage);
  }

  // Get user's current usage
  async getUserUsage(userId: string, userRole: string) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usage = await this.usageRepository.findOne({
      where: {
        userId,
        periodStart: Between(periodStart, periodEnd),
      },
    });

    const limits = USAGE_LIMITS[userRole?.toLowerCase().replace(/\s+/g, '_')] || USAGE_LIMITS.default;

    return {
      current: {
        messages: usage?.messagesSent || 0,
        conversations: usage?.conversationsCreated || 0,
        tokens: usage?.tokensUsed || 0,
      },
      limits: {
        messages: limits.messages,
        conversations: limits.conversations,
      },
      percentage: {
        messages: Math.round(((usage?.messagesSent || 0) / limits.messages) * 100),
        conversations: Math.round(((usage?.conversationsCreated || 0) / limits.conversations) * 100),
      },
      periodStart,
      periodEnd,
    };
  }

  // Create conversation
  async createConversation(userId: string, orgId: string, userRole: string, dto: CreateConversationDto) {
    await this.checkUsageLimits(userId, userRole, 'conversation');

    const conversation = this.conversationRepository.create({
      title: dto.title,
      userId,
      orgId,
      provider: dto.provider || 'gemini',
      messageCount: 0,
      tokensUsed: 0,
    });

    const saved = await this.conversationRepository.save(conversation);
    await this.incrementUsage(userId, 'conversation');

    return {
      success: true,
      data: saved,
    };
  }

  // Get all conversations for user
  async getConversations(userId: string, archived: boolean = false) {
    const conversations = await this.conversationRepository.find({
      where: { userId, archived },
      order: { updatedAt: 'DESC' },
      take: 50,
    });

    return {
      success: true,
      data: conversations,
    };
  }

  // Get conversation by ID with messages
  async getConversation(id: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id, userId },
      relations: ['messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Sort messages by creation date
    conversation.messages = conversation.messages.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    return {
      success: true,
      data: conversation,
    };
  }

  // Update conversation
  async updateConversation(id: string, userId: string, dto: UpdateConversationDto) {
    const conversation = await this.conversationRepository.findOne({
      where: { id, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    Object.assign(conversation, dto);
    const updated = await this.conversationRepository.save(conversation);

    return {
      success: true,
      data: updated,
    };
  }

  // Delete conversation
  async deleteConversation(id: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Delete using delete() instead of remove() to avoid relationship issues
    // Messages will be cascade deleted automatically
    await this.conversationRepository.delete(id);

    return {
      success: true,
      message: 'Conversation deleted successfully',
    };
  }

  // Add message to conversation
  async addMessage(conversationId: string, role: 'user' | 'assistant', content: string, tokens: number = 0) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = this.messageRepository.create({
      conversationId,
      role,
      content,
      tokens,
      metadata: {},
    });

    const saved = await this.messageRepository.save(message);

    // Update conversation stats
    conversation.messageCount += 1;
    conversation.tokensUsed += tokens;
    await this.conversationRepository.save(conversation);

    return saved;
  }

  // Update message
  async updateMessage(messageId: string, userId: string, dto: UpdateMessageDto) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['conversation'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.conversation.userId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.role !== 'user') {
      throw new BadRequestException('You can only edit user messages');
    }

    message.content = dto.content;
    message.edited = true;
    message.editedAt = new Date();

    const updated = await this.messageRepository.save(message);

    return {
      success: true,
      data: updated,
    };
  }

  // Delete message
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['conversation'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.conversation.userId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Store conversation and tokens before deletion
    const conversationId = message.conversation.id;
    const tokens = message.tokens;

    // Delete the message directly
    await this.messageRepository.delete(messageId);

    // Update conversation message count
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (conversation) {
      conversation.messageCount = Math.max(0, conversation.messageCount - 1);
      conversation.tokensUsed = Math.max(0, conversation.tokensUsed - tokens);
      await this.conversationRepository.save(conversation);
    }

    return {
      success: true,
      message: 'Message deleted successfully',
    };
  }
}
