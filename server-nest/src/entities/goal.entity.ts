import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('goals')
export class Goal {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: 'company' })
  type: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'real', default: 0 })
  progress: number;

  @Column()
  owner_id: string;

  @Column({ nullable: true })
  parent_goal_id: string;

  @Column({ nullable: true })
  due_date: string;

  @Column({ type: 'json', nullable: true })
  key_results: any[];

  @Column({ nullable: true })
  quarter: string;

  @CreateDateColumn()
  created_at: Date;
}
