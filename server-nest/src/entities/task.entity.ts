import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';
import { Sprint } from './sprint.entity';

@Entity('tasks')
export class Task {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  project_id: string;

  @Column({ nullable: true })
  sprint_id: string;

  @Column({ nullable: true })
  parent_task_id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'todo' })
  status: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ nullable: true })
  assignee_id: string;

  /** Multiple card members (Trello-style). `assignee_id` stays as the primary/first member. */
  @Column({ type: 'json', nullable: true })
  assignee_ids: string[];

  @Column({ nullable: true })
  reporter_id: string;

  @Column({ type: 'real', nullable: true })
  estimated_hours: number;

  @Column({ type: 'real', default: 0 })
  time_logged: number;

  @Column({ type: 'integer', nullable: true })
  story_points: number;

  @Column({ nullable: true })
  due_date: string;

  @Column({ type: 'json', nullable: true })
  dependencies: string[];

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Project, (project) => project.tasks)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Sprint, (sprint) => sprint.tasks, { nullable: true })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;
}
