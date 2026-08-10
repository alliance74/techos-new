import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
