import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  user_id: string;

  @Column()
  department: string;

  @Column()
  position: string;

  @Column({ default: 'full-time' })
  employment_type: string;

  @Column()
  start_date: string;

  @Column({ type: 'real', nullable: true })
  salary: number;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  emergency_contact: string;

  @Column({ nullable: true })
  manager_id: string;

  @Column({ type: 'json', nullable: true })
  skills: string[];

  @CreateDateColumn()
  created_at: Date;
}
