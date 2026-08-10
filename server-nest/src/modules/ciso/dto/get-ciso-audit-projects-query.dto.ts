import { IsIn, IsOptional } from 'class-validator';

export class GetCisoAuditProjectsQueryDto {
  @IsOptional()
  @IsIn(['needed', 'in_progress', 'completed'])
  status?: 'needed' | 'in_progress' | 'completed';
}
