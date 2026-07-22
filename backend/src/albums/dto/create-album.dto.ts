import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAlbumDto {
  @ApiProperty({ description: 'The title of the album' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'The artist of the album' })
  @IsString()
  @IsOptional()
  artist?: string;

  @ApiPropertyOptional({
    description: 'The URL or path to the cover image of the album',
  })
  @IsString()
  @IsOptional()
  coverUrl?: string;
}
