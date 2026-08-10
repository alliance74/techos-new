import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column({ nullable: true })
  contact_id: string;

  @Column()
  invoice_number: string;

  @Column({ type: 'varchar', nullable: true })
  client_name: string;

  @Column({ type: 'real' })
  amount: number;

  @Column({ type: 'real', default: 0 })
  tax: number;

  @Column({ type: 'real' })
  total: number;

  @Column({ default: 'draft' })
  status: string;

  @Column()
  due_date: string;

  @Column()
  issued_date: string;

  @Column({ type: 'json' })
  items: any[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
