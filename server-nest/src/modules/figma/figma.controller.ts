import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FigmaService, FigmaNode } from './figma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('figma')
export class FigmaController {
  private readonly logger = new Logger(FigmaController.name);

  constructor(private figmaService: FigmaService) {}

  /**
   * GET /figma/status - Check Figma configuration status
   */
  @Get('status')
  getStatus() {
    return {
      success: true,
      data: {
        configured: this.figmaService.isConfigured(),
        message: this.figmaService.isConfigured()
          ? 'Figma API is configured'
          : 'Figma API not configured - set FIGMA_API_KEY environment variable',
      },
    };
  }

  /**
   * GET /figma/file/:fileKey - Get Figma file
   */
  @Get('file/:fileKey')
  @UseGuards(JwtAuthGuard)
  async getFile(
    @CurrentUser() user: any,
    @Param('fileKey') fileKey: string,
    @Query('nodes') nodeIds?: string,
  ) {
    const nodes = nodeIds ? nodeIds.split(',') : undefined;
    const file = await this.figmaService.getFile(fileKey, nodes);
    return { success: true, data: file };
  }

  /**
   * GET /figma/file/:fileKey/nodes - Get specific nodes
   */
  @Get('file/:fileKey/nodes')
  @UseGuards(JwtAuthGuard)
  async getFileNodes(
    @CurrentUser() user: any,
    @Param('fileKey') fileKey: string,
    @Query('ids') nodeIds: string,
  ) {
    const nodes = await this.figmaService.getFileNodes(fileKey, nodeIds.split(','));
    return { success: true, data: nodes };
  }

  /**
   * GET /figma/file/:fileKey/tokens - Extract design tokens
   */
  @Get('file/:fileKey/tokens')
  @UseGuards(JwtAuthGuard)
  async getDesignTokens(
    @CurrentUser() user: any,
    @Param('fileKey') fileKey: string,
    @Query('format') format?: 'json' | 'css' | 'tailwind',
  ) {
    const tokens = await this.figmaService.extractDesignTokens(fileKey);

    if (format === 'css') {
      const css = this.figmaService.generateCssFromTokens(tokens);
      return {
        success: true,
        data: { tokens, css },
      };
    }

    if (format === 'tailwind') {
      const tailwindConfig = this.figmaService.generateTailwindConfig(tokens);
      return {
        success: true,
        data: { tokens, tailwindConfig },
      };
    }

    return { success: true, data: tokens };
  }

  /**
   * GET /figma/file/:fileKey/components - Get components
   */
  @Get('file/:fileKey/components')
  @UseGuards(JwtAuthGuard)
  async getComponents(
    @CurrentUser() user: any,
    @Param('fileKey') fileKey: string,
  ) {
    const components = await this.figmaService.getComponents(fileKey);
    return { success: true, data: components };
  }

  /**
   * GET /figma/file/:fileKey/images - Get images
   */
  @Get('file/:fileKey/images')
  @UseGuards(JwtAuthGuard)
  async getImages(
    @CurrentUser() user: any,
    @Param('fileKey') fileKey: string,
    @Query('ids') nodeIds: string,
    @Query('format') format?: 'png' | 'svg' | 'jpg',
  ) {
    const images = await this.figmaService.getImages(
      fileKey,
      nodeIds.split(','),
      format || 'png',
    );
    return { success: true, data: images };
  }

  /**
   * POST /figma/webhooks - Figma webhook endpoint
   */
  @Post('webhooks')
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const signature = req.headers['x-figma-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature if secret is configured
    if (this.figmaService.isConfigured()) {
      const isValid = this.figmaService.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        this.logger.warn('Invalid Figma webhook signature');
        return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Invalid signature' });
      }
    }

    // Process the event
    const result = await this.figmaService.processWebhookEvent(req.body);

    return res.status(HttpStatus.OK).json(result);
  }

  /**
   * GET /figma/webhooks/events - Get stored webhook events
   */
  @Get('webhooks/events')
  @UseGuards(JwtAuthGuard)
  async getWebhookEvents(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    const events = await this.figmaService.getWebhookEvents(
      user.org_id,
      Number(limit) || 50,
    );
    return { success: true, data: events };
  }

  /**
   * GET /figma/webhooks/events/:id - Get webhook event by ID
   */
  @Get('webhooks/events/:id')
  @UseGuards(JwtAuthGuard)
  async getWebhookEventById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const event = await this.figmaService.getWebhookEventById(id);
    if (!event) {
      return { success: false, message: 'Event not found' };
    }
    return { success: true, data: event };
  }

  /**
   * POST /figma/context - Get Figma context for AI assistant
   */
  @Post('context')
  @UseGuards(JwtAuthGuard)
  async getFigmaContext(
    @CurrentUser() user: any,
    @Body() body: { fileKey: string; nodeId?: string; prompt?: string },
  ) {
    const { fileKey, nodeId, prompt } = body;

    if (!fileKey) {
      return {
        success: false,
        message: 'fileKey is required',
      };
    }

    // Get file info
    const file = await this.figmaService.getFile(fileKey);

    // Get specific node if provided
    let nodeContext: FigmaNode | null = null;
    if (nodeId) {
      const nodes = await this.figmaService.getFileNodes(fileKey, [nodeId]);
      nodeContext = nodes[0] || null;
    }

    // Extract design tokens for context
    const tokens = await this.figmaService.extractDesignTokens(fileKey);

    // Build context for AI
    const context = {
      file: {
        name: file.name,
        lastModified: file.lastModified,
        version: file.version,
      },
      node: nodeContext,
      designTokens: {
        colors: tokens.colors.slice(0, 10),
        typography: tokens.typography.slice(0, 5),
        spacing: tokens.spacing.slice(0, 5),
      },
      componentsCount: Object.keys(file.components).length,
      stylesCount: Object.keys(file.styles).length,
    };

    return {
      success: true,
      data: context,
      prompt: this.buildFigmaPrompt(context, prompt),
    };
  }

  /**
   * Build a prompt with Figma context for the AI assistant
   */
  private buildFigmaPrompt(context: any, userPrompt?: string): string {
    const lines = [
      '# Figma Design Context',
      '',
      `File: ${context.file.name}`,
      `Last Modified: ${context.file.lastModified}`,
      `Version: ${context.file.version}`,
      '',
    ];

    if (context.node) {
      lines.push('## Selected Element');
      lines.push(`Name: ${context.node.name}`);
      lines.push(`Type: ${context.node.type}`);
      lines.push('');
    }

    if (context.designTokens.colors.length > 0) {
      lines.push('## Colors');
      for (const color of context.designTokens.colors) {
        lines.push(`- ${color.name}: ${color.value}`);
      }
      lines.push('');
    }

    if (context.designTokens.typography.length > 0) {
      lines.push('## Typography');
      for (const typo of context.designTokens.typography) {
        lines.push(`- ${typo.name}: ${typo.value}`);
      }
      lines.push('');
    }

    if (userPrompt) {
      lines.push('## User Request');
      lines.push(userPrompt);
    }

    return lines.join('\n');
  }
}
