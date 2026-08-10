import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customer_feedback')
export class CustomerFeedback {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column({ nullable: true })
  contact_id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  feedback: string;

  @Column({ default: 'feature_request' })
  type: string;

  @Column({ default: 'new' })
  status: string;

  @Column({ type: 'integer', nullable: true })
  rating: number;

  @Column({ nullable: true })
  source: string;

  @CreateDateColumn()
  created_at: Date;
}
