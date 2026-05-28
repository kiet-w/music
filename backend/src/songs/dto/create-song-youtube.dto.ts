import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSongYoutubeDto {
  @ApiProperty({ description: 'The YouTube URL of the song' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'The title of the song' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'The artist of the song' })
  @IsString()
  @IsOptional()
  artist?: string;

  @ApiPropertyOptional({ description: 'Optional Album ID' })
  @IsString()
  @IsOptional()
  albumId?: string;
}
