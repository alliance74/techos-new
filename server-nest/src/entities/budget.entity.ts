import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('budgets')
export class Budget {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ type: 'real' })
  allocated: number;

  @Column({ type: 'real', default: 0 })
  spent: number;

  @Column()
  period_start: string;

  @Column()
  period_end: string;

  @Column({ nullable: true })
  owner_id: string;

  @CreateDateColumn()
  created_at: Date;
}
