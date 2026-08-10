import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCisoReportDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsIn(['security', 'audit', 'compliance', 'risk'])
  type?: string;
}
