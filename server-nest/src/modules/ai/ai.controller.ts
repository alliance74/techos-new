import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { AiConversationService } from './ai-conversation.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatDto } from './dto/chat.dto';
import { CreateConversationDto, UpdateConversationDto, SendMessageDto, UpdateMessageDto } from './dto/conversation.dto';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private aiService: AiService,
    private conversationService: AiConversationService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI about your system' })
  @ApiResponse({ status: 200, description: 'AI response generated' })
  @ApiResponse({ status: 400, description: 'Bad request - message is required' })
  chat(
    @CurrentUser() user: any,
    @Body() chatDto: ChatDto,
  ) {
    return this.aiService.chat(user.org_id, user.id, chatDto.message, chatDto.provider);
  }

  // Conversation Management
  @Post('conversations')
  @ApiOperation({ summary: 'Create a new AI conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  createConversation(
    @CurrentUser() user: any,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationService.createConversation(user.id, user.org_id, user.role, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for user' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  getConversations(
    @CurrentUser() user: any,
    @Query('archived') archived?: string,
  ) {
    return this.conversationService.getConversations(user.id, archived === 'true');
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID with messages' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  getConversation(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.conversationService.getConversation(id, user.id);
  }

  @Put('conversations/:id')
  @ApiOperation({ summary: 'Update conversation' })
  @ApiResponse({ status: 200, description: 'Conversation updated' })
  updateConversation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.conversationService.updateConversation(id, user.id, dto);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete conversation' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  deleteConversation(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.conversationService.deleteConversation(id, user.id);
  }

  // Message Management
  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send message in conversation' })
  @ApiResponse({ status: 200, description: 'Message sent and AI response received' })
  async sendMessage(
    @CurrentUser() user: any,
    @Param('id') conversationId: string,
    @Body() dto: { message: string },
  ) {
    return this.aiService.chatInConversation(user.org_id, user.id, conversationId, dto.message);
  }

  @Put('messages/:id')
  @ApiOperation({ summary: 'Edit a message' })
  @ApiResponse({ status: 200, description: 'Message updated' })
  updateMessage(
    @CurrentUser() user: any,
    @Param('id') messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.conversationService.updateMessage(messageId, user.id, dto);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  deleteMessage(
    @CurrentUser() user: any,
    @Param('id') messageId: string,
  ) {
    return this.conversationService.deleteMessage(messageId, user.id);
  }

  // Usage tracking
  @Get('usage')
  @ApiOperation({ summary: 'Get current AI usage stats' })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  getUsage(@CurrentUser() user: any) {
    return this.conversationService.getUserUsage(user.id, user.role);
  }

  @Get('generate-report')
  @ApiOperation({ summary: 'Generate AI-powered report' })
  @ApiResponse({ status: 200, description: 'Report generated' })
  generateReport(
    @CurrentUser() user: any,
    @Query('type') type: string,
    @Query('provider') provider?: 'openai' | 'claude' | 'gemini' | 'grok',
  ) {
    return this.aiService.generateReport(user.org_id, type, provider);
  }

  @Get('analyze-risk')
  @ApiOperation({ summary: 'AI risk analysis across all areas' })
  @ApiResponse({ status: 200, description: 'Risk analysis completed' })
  analyzeRisk(
    @CurrentUser() user: any,
    @Query('provider') provider?: 'openai' | 'claude' | 'gemini' | 'grok',
  ) {
    return this.aiService.analyzeRisk(user.org_id, provider);
  }

  @Get('suggest-priorities')
  @ApiOperation({ summary: 'AI-suggested priorities' })
  @ApiResponse({ status: 200, description: 'Priorities suggested' })
  suggestPriorities(
    @CurrentUser() user: any,
    @Query('provider') provider?: 'openai' | 'claude' | 'gemini' | 'grok',
  ) {
    return this.aiService.suggestPriorities(user.org_id, provider);
  }
}
