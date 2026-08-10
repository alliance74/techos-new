import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Organization } from './organization.entity';
import { Sprint } from './sprint.entity';
import { Task } from './task.entity';

@Entity('projects')
export class Project {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ nullable: true })
  start_date: string;

  @Column({ nullable: true })
  end_date: string;

  @Column({ type: 'real', nullable: true })
  budget: number;

  @Column({ nullable: true })
  created_by: string;

  /**
   * Roles allowed to see this project.
   * null / empty = visible to all roles in the org.
   * CEO always bypasses this filter.
   */
  @Column({ type: 'json', nullable: true })
  visible_to_roles: string[] | null;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Organization, (org) => org.projects)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @OneToMany(() => Sprint, (sprint) => sprint.project)
  sprints: Sprint[];

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];
}
