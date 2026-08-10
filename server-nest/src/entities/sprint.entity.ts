import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';

@Entity('sprints')
export class Sprint {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  project_id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  goal: string;

  @Column()
  start_date: string;

  @Column()
  end_date: string;

  @Column({ default: 'planned' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Project, (project) => project.sprints)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => Task, (task) => task.sprint)
  tasks: Task[];
}
