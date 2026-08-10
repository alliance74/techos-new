import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  employee_id: string;

  @Column()
  org_id: string;

  @Column()
  type: string;

  @Column()
  start_date: string;

  @Column()
  end_date: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ nullable: true })
  approved_by: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @CreateDateColumn()
  created_at: Date;
}
