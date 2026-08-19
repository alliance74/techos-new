import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateAuditTaskDto {
  @IsOptional()
  @IsUUID()
  project_audit_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['todo', 'in_progress', 'done'])
  status?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  priority?: string;
}
