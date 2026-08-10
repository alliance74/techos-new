import { IsIn, IsOptional } from 'class-validator';

export class GetCisoTasksQueryDto {
  @IsOptional()
  @IsIn(['finished', 'not_finished'])
  status?: 'finished' | 'not_finished';
}
