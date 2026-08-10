import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('calendar_events')
export class CalendarEvent {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  start_datetime: string;

  @Column()
  end_datetime: string;

  @Column({ default: false })
  all_day: boolean;

  @Column({ default: 'event' })
  type: string;

  @Column({ nullable: true })
  color: string;

  @Column({ type: 'json', nullable: true })
  recurrence: any;

  @Column()
  created_by: string;

  @Column({ type: 'json', nullable: true })
  attendees: string[];

  @CreateDateColumn()
  created_at: Date;
}
