import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column()
  user_id: string;

  @Column()
  action: string;

  @Column()
  resource_type: string;

  @Column()
  resource_id: string;

  @Column({ type: 'json', nullable: true })
  changes: any;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @CreateDateColumn()
  created_at: Date;
}
