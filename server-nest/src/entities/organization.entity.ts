import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

@Entity('organizations')
export class Organization {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ default: 'free' })
  plan: string;

  @Column({ type: 'text', nullable: true })
  vision: string;

  @Column({ type: 'text', nullable: true })
  mission: string;

  @Column({ type: 'json', nullable: true })
  settings: any;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => Project, (project) => project.organization)
  projects: Project[];
}
