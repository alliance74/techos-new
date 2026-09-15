import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GithubInstallation } from './github-installation.entity';

@Entity('github_events')
export class GithubEvent {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  installation_id: string;

  @Column()
  event_type: string; // 'push', 'pull_request', 'issues', etc.

  @Column()
  action: string; // 'opened', 'closed', 'synchronized', etc.

  @Column({ nullable: true })
  delivery_id: string; // GitHub webhook delivery ID for dedup

  @Column({ type: 'bigint', nullable: true })
  github_repo_id: number;

  @Column({ nullable: true })
  repo_full_name: string;

  @Column({ type: 'json', nullable: true })
  payload: any; // Raw webhook payload

  @Column({ default: 'processed' })
  status: string; // 'pending', 'processed', 'failed', 'ignored'

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => GithubInstallation, (inst) => inst.id)
  @JoinColumn({ name: 'installation_id' })
  installation: GithubInstallation;
}
