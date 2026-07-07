import { IsNotEmpty, IsString } from 'class-validator';

export class MoveSongDto {
  @IsNotEmpty({ message: 'albumId should not be empty' })
  @IsString()
  albumId: string;
}
