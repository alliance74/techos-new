import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('deals')
export class Deal {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  contact_id: string;

  @Column()
  title: string;

  @Column({ type: 'real' })
  value: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: 'qualification' })
  stage: string;

  @Column({ type: 'integer', default: 0 })
  probability: number;

  @Column({ nullable: true })
  expected_close_date: string;

  @Column()
  assigned_to: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
