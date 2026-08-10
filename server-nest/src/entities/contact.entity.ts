import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  company_name: string;

  @Column({ nullable: true })
  job_title: string;

  @Column({ default: 'lead' })
  type: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  custom_fields: any;

  @CreateDateColumn()
  created_at: Date;
}
