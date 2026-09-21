import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('figma_webhook_events')
export class FigmaWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  org_id: string;

  @Column()
  event_type: string; // FILE_UPDATE, FILE_VERSION_UPDATE, FILE_DELETE, LIBRARY_PUBLISH

  @Column({ nullable: true })
  file_key: string;

  @Column({ nullable: true })
  file_name: string;

  @Column({ nullable: true })
  timestamp: string;

  @Column({ type: 'text', nullable: true })
  payload: string; // Raw JSON payload

  @Column({ nullable: true })
  triggered_by: string; // User ID who triggered the event

  @Column({ default: 'received' })
  status: string; // received, processed, failed

  @Column({ type: 'text', nullable: true })
  changes_summary: string; // Summary of what changed

  @Column({ type: 'text', nullable: true })
  metadata: string; // Additional metadata as JSON

  @CreateDateColumn()
  created_at: Date;
}
