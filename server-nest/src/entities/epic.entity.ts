import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('epics')
export class Epic {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'planned' })
  status: string;

  @Column({ nullable: true })
  owner_id: string;

  @Column({ nullable: true })
  start_date: string;

  @Column({ nullable: true })
  end_date: string;

  @Column({ type: 'real', default: 0 })
  progress: number;

  @CreateDateColumn()
  created_at: Date;
}
