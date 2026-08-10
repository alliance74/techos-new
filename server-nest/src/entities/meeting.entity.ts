import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('meetings')
export class Meeting {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  date: string;

  @Column()
  scheduled_at: string;

  @Column()
  start_time: string;

  @Column()
  end_time: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  meeting_link: string;

  @Column({ nullable: true })
  type: string;

  @Column({ default: 'scheduled' })
  status: string;

  @Column()
  organizer_id: string;

  @Column({ type: 'text', nullable: true })
  agenda: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  ai_summary: string;

  @Column({ type: 'json', nullable: true })
  decisions: string[];

  @Column({ nullable: true })
  recording_url: string;

  @CreateDateColumn()
  created_at: Date;
}
