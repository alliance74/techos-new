import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AiConversation } from './ai-conversation.entity';

@Entity('ai_messages')
export class AiMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => AiConversation, conversation => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: AiConversation;

  @Column({ type: 'varchar', length: 20 })
  role: string; // 'user' or 'assistant'

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  tokens: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  edited: boolean;

  @Column({ name: 'edited_at', type: 'datetime', nullable: true })
  editedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
