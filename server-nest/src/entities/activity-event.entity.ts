import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('activity_events')
export class ActivityEvent {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column()
  org_id: string;

  @Index()
  @Column()
  entity_type: string;

  @Index()
  @Column()
  entity_id: string;

  @Column()
  action: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ nullable: true })
  actor_id: string;

  @Column({ nullable: true })
  actor_name: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
