import { IsIn } from 'class-validator';

export class UpdateCisoAuditStatusDto {
  @IsIn(['needed', 'in_progress', 'completed'])
  audit_status: 'needed' | 'in_progress' | 'completed';
}
