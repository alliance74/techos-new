import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({
    description: 'The message to send to the AI',
    example: 'What are the top priority tasks this week?',
  })
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  message: string;

  @ApiProperty({
    description: 'AI provider to use',
    enum: ['openai', 'claude', 'gemini', 'grok'],
    required: false,
    default: 'openai',
  })
  @IsOptional()
  @IsIn(['openai', 'claude', 'gemini', 'grok'])
  provider?: 'openai' | 'claude' | 'gemini' | 'grok';
}
