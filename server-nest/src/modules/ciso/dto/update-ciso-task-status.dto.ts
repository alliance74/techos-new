import { IsBoolean } from 'class-validator';

export class UpdateCisoTaskStatusDto {
  @IsBoolean()
  finished: boolean;
}
