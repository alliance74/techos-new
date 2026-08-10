import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('channels')
export class Channel {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'public' })
  type: string;

  @Column()
  created_by: string;

  @Column({ default: false })
  is_archived: boolean;

  @CreateDateColumn()
  created_at: Date;
}
