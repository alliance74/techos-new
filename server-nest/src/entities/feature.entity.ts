import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('features')
export class Feature {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  epic_id: string;

  @Column({ default: 'backlog' })
  status: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ nullable: true })
  owner_id: string;

  @Column({ nullable: true })
  release_id: string;

  @Column({ type: 'json', nullable: true })
  user_stories: any[];

  @Column({ type: 'integer', default: 0 })
  votes: number;

  @CreateDateColumn()
  created_at: Date;
}
