import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsEnum(['vacation', 'sick', 'personal', 'unpaid', 'other'])
  type: string;

  @IsNotEmpty()
  @IsString()
  start_date: string;

  @IsNotEmpty()
  @IsString()
  end_date: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}
