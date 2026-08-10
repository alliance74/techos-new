import { IsString, IsOptional, IsNumber, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

const PROJECT_ROLES = [
  'ceo',
  'cto',
  'ciso',
  'finance',
  'software_engineer',
  'ui_ux_designer',
  'customer_support',
] as const;

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  client_name?: string;

  @IsOptional()
  @IsArray()
  @IsIn(PROJECT_ROLES, { each: true })
  visible_to_roles?: string[] | null;
}
