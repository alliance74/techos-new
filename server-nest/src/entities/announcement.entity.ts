import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('announcements')
export class Announcement {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 'normal' })
  priority: string;

  @Column()
  author_id: string;

  @Column({ default: false })
  is_pinned: boolean;

  @CreateDateColumn()
  created_at: Date;
}
