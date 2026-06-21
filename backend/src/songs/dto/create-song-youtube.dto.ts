import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSongYoutubeDto {
  @ApiProperty({ description: 'The YouTube URL of the song' })
  @IsUrl()
  @IsNotEmpty()
  @MaxLength(500)
  url: string;

  @ApiProperty({ description: 'The title of the song' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({ description: 'The artist of the song' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  artist?: string;

  @ApiPropertyOptional({ description: 'Optional Album ID' })
  @IsString()
  @IsOptional()
  albumId?: string;
}
