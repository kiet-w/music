import { IsString, IsNotEmpty } from 'class-validator';

export class ImportDto {
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  albumId: string;
}
