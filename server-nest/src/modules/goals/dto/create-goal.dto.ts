import { IsString, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  type?: string; // company, department, team, individual

  @IsString()
  owner_id: string;

  @IsString()
  @IsOptional()
  parent_goal_id?: string;

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

  @IsString()
  @IsOptional()
  quarter?: string; // e.g., "Q1 2024"
}
