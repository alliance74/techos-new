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
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { McpRegistryService } from './mcp-registry.service';

@Controller('mcp-registry')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
export class McpRegistryController {
  constructor(private mcpService: McpRegistryService) {}

  @Post('tools')
  registerTool(@CurrentUser() user: any, @Body() body: any) {
    return this.mcpService.registerTool(user.org_id, { ...body, owner_id: user.id });
  }

  @Get('tools')
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.mcpService.findAll(user.org_id, query);
  }

  @Get('tools/:id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.mcpService.findOne(id, user.org_id);
  }

  @Put('tools/:id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.mcpService.update(id, user.org_id, body);
  }

  @Delete('tools/:id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.mcpService.remove(id, user.org_id);
  }

  @Post('tools/:id/usage')
  recordUsage(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
    return this.mcpService.recordUsage(id, user.org_id, {
      user_id: user.id,
      duration_ms: body.duration_ms,
      success: body.success,
      error: body.error,
    });
  }

  @Get('stats')
  getUsageStats(@CurrentUser() user: any, @Query('tool_id') toolId?: string) {
    return this.mcpService.getUsageStats(user.org_id, toolId);
  }

  @Get('discover')
  discoverTools(@CurrentUser() user: any, @Query('q') query: string) {
    return this.mcpService.discoverTools(user.org_id, query);
  }
}
