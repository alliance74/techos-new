import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CodeReviewFile = {
  path: string;
  additions?: number;
  deletions?: number;
  patch?: string;
  status?: string;
};

@Entity('code_reviews')
export class CodeReview {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: 'open' })
  status: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ type: 'varchar', nullable: true })
  project_id: string | null;

  @Column()
  author_id: string;

  @Column({ type: 'varchar', nullable: true })
  reviewer_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  repository: string | null;

  @Column({ type: 'varchar', nullable: true })
  branch: string | null;

  @Column({ type: 'varchar', nullable: true })
  base_branch: string | null;

  @Column({ type: 'varchar', nullable: true })
  pr_url: string | null;

  @Column({ type: 'json', nullable: true })
  files: CodeReviewFile[] | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
