import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('roadmaps')
export class Roadmap {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'product' })
  type: string;

  @Column({ nullable: true })
  owner_id: string;

  @Column({ type: 'json' })
  items: any[];

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
