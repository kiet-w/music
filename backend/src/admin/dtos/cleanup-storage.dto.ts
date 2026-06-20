import { IsNotEmpty, IsString } from 'class-validator';

export class CleanupStorageDto {
  @IsString()
  @IsNotEmpty()
  bucketName: string;

  @IsString()
  @IsNotEmpty()
  path: string;
}
