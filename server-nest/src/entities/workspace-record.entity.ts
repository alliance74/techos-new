import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('workspace_records')
export class WorkspaceRecord {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column()
  org_id: string;

  @Index()
  @Column()
  type: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  priority: string;

  @Column({ nullable: true })
  owner: string;

  @Column({ type: 'real', nullable: true })
  amount: number;

  @Column({ nullable: true })
  due_date: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
