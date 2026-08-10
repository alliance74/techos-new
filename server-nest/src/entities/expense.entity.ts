import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('expenses')
export class Expense {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  category: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'real' })
  amount: number;

  @Column()
  date: string;

  @Column({ default: 'pending' })
  status: string;

  @Column()
  submitted_by: string;

  @Column({ nullable: true })
  approved_by: string;

  @Column({ nullable: true })
  receipt_url: string;

  @CreateDateColumn()
  created_at: Date;
}
