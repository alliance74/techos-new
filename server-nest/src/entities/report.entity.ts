import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  title: string;

  @Column()
  type: string;

  @Column({ type: 'json' })
  config: any;

  @Column({ type: 'json', nullable: true })
  data: any;

  @Column()
  created_by: string;

  @Column({ nullable: true })
  scheduled: string;

  @CreateDateColumn()
  created_at: Date;
}
