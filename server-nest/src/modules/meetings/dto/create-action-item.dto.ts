import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateActionItemDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  assignee_id: string;

  @IsOptional()
  @IsString()
  due_date?: string;
}
