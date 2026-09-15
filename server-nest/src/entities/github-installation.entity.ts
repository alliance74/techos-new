import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { GithubRepository } from './github-repository.entity';

@Entity('github_installations')
export class GithubInstallation {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column({ type: 'bigint' })
  installation_id: number;

  @Column({ type: 'bigint' })
  github_account_id: number;

  @Column()
  account_login: string;

  @Column()
  account_type: string; // 'Organization' or 'User'

  @Column({ nullable: true })
  access_tokens_url: string;

  @Column({ nullable: true })
  repositories_url: string;

  @Column({ default: 'active' })
  status: string; // 'active', 'suspended', 'deleted'

  @Column({ type: 'json', nullable: true })
  permissions: any;

  @Column({ type: 'json', nullable: true })
  events: string[];

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  suspended_at: Date;

  @ManyToOne(() => Organization, (org) => org.id)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @OneToMany(() => GithubRepository, (repo) => repo.installation)
  repositories: GithubRepository[];
}
