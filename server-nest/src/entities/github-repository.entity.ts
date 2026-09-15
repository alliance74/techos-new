import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GithubInstallation } from './github-installation.entity';

@Entity('github_repositories')
export class GithubRepository {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  installation_id: string;

  @Column({ type: 'bigint' })
  github_repo_id: number;

  @Column()
  name: string;

  @Column()
  full_name: string; // owner/repo

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  private: boolean;

  @Column({ nullable: true })
  default_branch: string;

  @Column({ nullable: true })
  language: string;

  @Column({ type: 'bigint', default: 0 })
  stars_count: number;

  @Column({ type: 'bigint', default: 0 })
  forks_count: number;

  @Column({ default: true })
  sync_enabled: boolean; // Whether to sync issues, PRs, etc.

  @Column({ default: 'active' })
  status: string; // 'active', 'archived', 'removed'

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_at: Date;

  @ManyToOne(() => GithubInstallation, (inst) => inst.repositories)
  @JoinColumn({ name: 'installation_id' })
  installation: GithubInstallation;
}
