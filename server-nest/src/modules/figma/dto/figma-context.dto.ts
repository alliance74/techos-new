import { IsString, IsOptional } from 'class-validator';

export class FigmaContextDto {
  @IsString()
  fileKey: string;

  @IsString()
  @IsOptional()
  nodeId?: string;

  @IsString()
  @IsOptional()
  prompt?: string;
}

export class FigmaTokenExtractionDto {
  @IsString()
  fileKey: string;

  @IsString()
  @IsOptional()
  format?: 'json' | 'css' | 'tailwind';
}
