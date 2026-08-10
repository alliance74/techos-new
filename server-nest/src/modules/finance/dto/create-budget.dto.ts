import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateBudgetDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsNumber()
  allocated: number;

  @IsNotEmpty()
  @IsString()
  period_start: string;

  @IsNotEmpty()
  @IsString()
  period_end: string;
}
