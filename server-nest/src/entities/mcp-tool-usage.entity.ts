import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('mcp_tool_usage')
export class McpToolUsage {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  tool_id: string;

  @Column()
  org_id: string;

  @Column({ nullable: true })
  user_id: string;

  @Column()
  invocation_count: number;

  @Column({ type: 'real', default: 0 })
  total_duration_ms: number;

  @Column({ type: 'integer', default: 0 })
  success_count: number;

  @Column({ type: 'integer', default: 0 })
  error_count: number;

  @Column({ type: 'json', nullable: true })
  last_error: any;

  @Column()
  period_start: Date;

  @Column()
  period_end: Date;

  @CreateDateColumn()
  created_at: Date;
}
