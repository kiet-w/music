import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ImportDto {
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  driveToken?: string;

  @IsString()
  @IsOptional()
  albumId?: string;
}
