import { IsNotEmpty, IsString } from 'class-validator';

export class MoveSongDto {
  @IsNotEmpty({ message: 'albumId khong duoc de trong' })
  @IsString()
  albumId: string;
}
