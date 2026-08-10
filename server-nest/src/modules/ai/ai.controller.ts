import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI about your system' })
  @ApiResponse({ status: 200, description: 'AI response generated' })
  chat(
    @CurrentUser() user: any,
    @Body('message') message: string,
    @Body('provider') provider?: 'openai' | 'claude' | 'gemini' | 'grok',
  ) {
    return this.aiService.chat(user.org_id, user.id, message, provider);
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
