import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  priority?: string; // normal, high, urgent

  @IsBoolean()
  @IsOptional()
  is_pinned?: boolean;
}
