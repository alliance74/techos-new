import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('bugs')
export class Bug {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'open' })
  status: string;

  @Column({ default: 'medium' })
  severity: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ nullable: true })
  assignee_id: string;

  @Column()
  reporter_id: string;

  @Column({ nullable: true })
  project_id: string;

  @Column({ type: 'text', nullable: true })
  steps_to_reproduce: string;

  @Column({ type: 'text', nullable: true })
  expected_behavior: string;

  @Column({ type: 'text', nullable: true })
  actual_behavior: string;

  @Column({ nullable: true })
  environment: string;

  @CreateDateColumn()
  created_at: Date;
}
