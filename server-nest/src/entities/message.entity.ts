import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  channel_id: string;

  @Column()
  user_id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  parent_message_id: string;

  @Column({ type: 'json', nullable: true })
  attachments: string[];

  @Column({ type: 'json', nullable: true })
  mentions: string[];

  @Column({ type: 'json', nullable: true })
  reactions: Record<string, string[]>; // emoji -> user_ids

  @Column({ default: false })
  is_edited: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ nullable: true })
  edited_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

