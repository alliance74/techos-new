import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { McpTool } from '../../entities/mcp-tool.entity';
import { McpToolUsage } from '../../entities/mcp-tool-usage.entity';

@Injectable()
export class McpRegistryService {
  private readonly logger = new Logger(McpRegistryService.name);

  constructor(
    @InjectRepository(McpTool)
    private toolRepository: Repository<McpTool>,
    @InjectRepository(McpToolUsage)
    private usageRepository: Repository<McpToolUsage>,
  ) {}

  async registerTool(org_id: string, dto: any) {
    const tool = this.toolRepository.create({
      id: randomUUID(),
      org_id,
      name: dto.name,
      description: dto.description,
      category: dto.category || 'integration',
      protocol: dto.protocol || 'mcp',
      endpoint_url: dto.endpoint_url,
      input_schema: dto.input_schema || {},
      output_schema: dto.output_schema || {},
      config: dto.config || {},
      status: 'active',
      version: dto.version || '1.0.0',
      owner_id: dto.owner_id,
      tags: dto.tags || [],
    });

    await this.toolRepository.save(tool);
    this.logger.log(`MCP tool registered: ${tool.name} (${tool.id})`);
    return { success: true, data: tool };
  }

  async findAll(org_id: string, filters?: any) {
    const query = this.toolRepository
      .createQueryBuilder('tool')
      .where('tool.org_id = :org_id', { org_id });

    if (filters?.category) {
      query.andWhere('tool.category = :category', { category: filters.category });
    }
    if (filters?.status) {
      query.andWhere('tool.status = :status', { status: filters.status });
    }
    if (filters?.protocol) {
      query.andWhere('tool.protocol = :protocol', { protocol: filters.protocol });
    }

    const tools = await query.orderBy('tool.name', 'ASC').getMany();
    return { success: true, data: tools };
  }

  async findOne(id: string, org_id: string) {
    const tool = await this.toolRepository.findOne({ where: { id, org_id } });
    if (!tool) throw new NotFoundException('MCP tool not found');
    return { success: true, data: tool };
  }

  async update(id: string, org_id: string, dto: any) {
    const tool = await this.toolRepository.findOne({ where: { id, org_id } });
    if (!tool) throw new NotFoundException('MCP tool not found');

    Object.assign(tool, dto);
    tool.updated_at = new Date();
    await this.toolRepository.save(tool);
    return { success: true, data: tool };
  }

  async remove(id: string, org_id: string) {
    const tool = await this.toolRepository.findOne({ where: { id, org_id } });
    if (!tool) throw new NotFoundException('MCP tool not found');
    await this.toolRepository.delete(id);
    return { success: true, message: 'Tool removed' };
  }

  async recordUsage(tool_id: string, org_id: string, dto: {
    user_id?: string;
    duration_ms: number;
    success: boolean;
    error?: any;
  }) {
    const tool = await this.toolRepository.findOne({ where: { id: tool_id } });
    if (!tool) return;

    // Update tool stats
    tool.usage_count += 1;
    tool.avg_response_time_ms =
      (tool.avg_response_time_ms * (tool.usage_count - 1) + dto.duration_ms) /
      tool.usage_count;
    if (dto.success) {
      tool.success_rate = ((tool.success_rate * (tool.usage_count - 1)) + 100) / tool.usage_count;
    } else {
      tool.success_rate = (tool.success_rate * (tool.usage_count - 1)) / tool.usage_count;
    }
    await this.toolRepository.save(tool);

    // Record usage entry
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const periodEnd = new Date(periodStart.getTime() + 86400000);

    let usage = await this.usageRepository.findOne({
      where: {
        tool_id,
        user_id: dto.user_id || 'system',
        period_start: periodStart,
      },
    });

    if (!usage) {
      usage = this.usageRepository.create({
        id: randomUUID(),
        tool_id,
        org_id,
        user_id: dto.user_id || 'system',
        invocation_count: 0,
        total_duration_ms: 0,
        success_count: 0,
        error_count: 0,
        period_start: periodStart,
        period_end: periodEnd,
      });
    }

    usage.invocation_count += 1;
    usage.total_duration_ms += dto.duration_ms;
    if (dto.success) usage.success_count += 1;
    else {
      usage.error_count += 1;
      usage.last_error = dto.error;
    }
    await this.usageRepository.save(usage);
  }

  async getUsageStats(org_id: string, tool_id?: string) {
    if (tool_id) {
      const tool = await this.toolRepository.findOne({ where: { id: tool_id, org_id } });
      if (!tool) throw new NotFoundException('Tool not found');
      const usages = await this.usageRepository.find({
        where: { tool_id, org_id },
        order: { period_start: 'DESC' },
        take: 30,
      });
      return { success: true, data: { tool, usages } };
    }

    const tools = await this.toolRepository.find({ where: { org_id } });
    const stats = {
      total_tools: tools.length,
      active_tools: tools.filter((t) => t.status === 'active').length,
      total_invocations: tools.reduce((sum, t) => sum + t.usage_count, 0),
      avg_response_time: tools.length
        ? tools.reduce((sum, t) => sum + t.avg_response_time_ms, 0) / tools.length
        : 0,
      avg_success_rate: tools.length
        ? tools.reduce((sum, t) => sum + t.success_rate, 0) / tools.length
        : 0,
      by_category: {} as Record<string, number>,
      by_protocol: {} as Record<string, number>,
    };

    for (const tool of tools) {
      stats.by_category[tool.category] = (stats.by_category[tool.category] || 0) + 1;
      stats.by_protocol[tool.protocol] = (stats.by_protocol[tool.protocol] || 0) + 1;
    }

    return { success: true, data: stats };
  }

  async discoverTools(org_id: string, query: string) {
    const tools = await this.toolRepository
      .createQueryBuilder('tool')
      .where('tool.org_id = :org_id', { org_id })
      .andWhere('tool.status = :status', { status: 'active' })
      .andWhere(
        '(tool.name LIKE :q OR tool.description LIKE :q OR tool.tags LIKE :tags)',
        { q: `%${query}%`, tags: `%${query}%` },
      )
      .orderBy('tool.usage_count', 'DESC')
      .getMany();

    return { success: true, data: tools };
  }
}
