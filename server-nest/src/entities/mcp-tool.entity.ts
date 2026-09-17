import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('mcp_tools')
export class McpTool {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  category: string; // 'productivity', 'development', 'analytics', 'communication', 'integration'

  @Column()
  protocol: string; // 'mcp', 'rest', 'graphql'

  @Column({ type: 'text', nullable: true })
  endpoint_url: string;

  @Column({ type: 'json', nullable: true })
  input_schema: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  output_schema: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  config: Record<string, any>;

  @Column({ default: 'active' })
  status: string; // 'active', 'inactive', 'deprecated'

  @Column({ type: 'integer', default: 0 })
  usage_count: number;

  @Column({ type: 'real', default: 0 })
  avg_response_time_ms: number;

  @Column({ type: 'real', default: 100 })
  success_rate: number;

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  owner_id: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
