import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('kpis')
export class KPI {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'real' })
  target: number;

  @Column({ type: 'real', default: 0 })
  current: number;

  @Column()
  unit: string;

  @Column()
  frequency: string;

  @Column()
  owner_id: string;

  @Column({ nullable: true })
  category: string;

  @CreateDateColumn()
  created_at: Date;
}
