import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('ai_usage')
@Index(['userId', 'periodStart'])
export class AiUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  @Column({ name: 'messages_sent', default: 0 })
  messagesSent: number;

  @Column({ name: 'tokens_used', default: 0 })
  tokensUsed: number;

  @Column({ name: 'conversations_created', default: 0 })
  conversationsCreated: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
