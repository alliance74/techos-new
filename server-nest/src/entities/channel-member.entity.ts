import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('channel_members')
export class ChannelMember {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  channel_id: string;

  @Column()
  user_id: string;

  @Column({ default: 'member' })
  role: string; // admin, member

  @Column({ nullable: true })
  last_read_at: Date;

  @CreateDateColumn()
  joined_at: Date;
}
