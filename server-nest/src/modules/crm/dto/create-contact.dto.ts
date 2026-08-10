import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum } from 'class-validator';

export class CreateContactDto {
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @IsEnum(['lead', 'prospect', 'customer', 'partner'])
  type?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'qualified', 'unqualified'])
  status?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  custom_fields?: any;
}
