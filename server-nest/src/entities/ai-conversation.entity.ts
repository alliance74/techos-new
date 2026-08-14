import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { AiMessage } from './ai-message.entity';

@Entity('ai_conversations')
export class AiConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ type: 'varchar', length: 20, default: 'gemini' })
  provider: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ name: 'message_count', default: 0 })
  messageCount: number;

  @Column({ name: 'tokens_used', default: 0 })
  tokensUsed: number;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @OneToMany(() => AiMessage, message => message.conversation)
  messages: AiMessage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
