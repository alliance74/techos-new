import { IsString, IsOptional } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  priority?: string; // normal, high, urgent
}
