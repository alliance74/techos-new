import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('releases')
export class Release {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  version: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'planned' })
  status: string;

  @Column({ nullable: true })
  release_date: string;

  @Column({ type: 'json', nullable: true })
  release_notes: string[];

  @CreateDateColumn()
  created_at: Date;
}
