import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateRecordCommentDto {
  @IsString()
  @IsNotEmpty()
  entity_type: string;

  @IsString()
  @IsNotEmpty()
  entity_id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  body: string;
}
