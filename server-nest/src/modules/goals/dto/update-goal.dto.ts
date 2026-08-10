import { IsString, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string; // active, completed, cancelled

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @IsString()
  @IsOptional()
  owner_id?: string;

  @IsString()
  @IsOptional()
  due_date?: string;

  @IsArray()
  @IsOptional()
  key_results?: Array<{
    title: string;
    target: number;
    current: number;
    unit: string;
  }>;
}
