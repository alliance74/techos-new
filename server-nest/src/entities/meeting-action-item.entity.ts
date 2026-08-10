import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('meeting_action_items')
export class MeetingActionItem {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  meeting_id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  assignee_id: string;

  @Column({ default: 'pending' })
  status: string; // pending, in-progress, completed

  @Column({ nullable: true })
  due_date: string;

  @CreateDateColumn()
  created_at: Date;
}
