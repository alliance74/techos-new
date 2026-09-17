import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { McpRegistryController } from './mcp-registry.controller';
import { McpRegistryService } from './mcp-registry.service';
import { McpTool } from '../../entities/mcp-tool.entity';
import { McpToolUsage } from '../../entities/mcp-tool-usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([McpTool, McpToolUsage])],
  controllers: [McpRegistryController],
  providers: [McpRegistryService],
  exports: [McpRegistryService],
})
export class McpRegistryModule {}
