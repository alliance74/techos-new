import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ description: 'Conversation title', example: 'Project status discussion' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'AI provider', enum: ['openai', 'claude', 'gemini', 'grok'], required: false })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class UpdateConversationDto {
  @ApiProperty({ description: 'Conversation title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Conversation summary', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: 'Archive status', required: false })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ description: 'Message content', example: 'What are my top priorities?' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class UpdateMessageDto {
  @ApiProperty({ description: 'New message content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
