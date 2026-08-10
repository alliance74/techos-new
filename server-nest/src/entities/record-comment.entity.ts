import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('record_comments')
export class RecordComment {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column()
  org_id: string;

  @Index()
  @Column()
  entity_type: string;

  @Index()
  @Column()
  entity_id: string;

  @Column({ type: 'text' })
  body: string;

  @Column()
  author_id: string;

  @Column()
  author_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
