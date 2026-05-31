import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SongService } from './song.service';
import { CreateSongYoutubeDto } from './dto/create-song-youtube.dto';
import { SongResponseDto } from './dto/song-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('songs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('songs')
@UseInterceptors(ClassSerializerInterceptor)
export class SongController {
  constructor(private readonly songService: SongService) {}

  @ApiOperation({ summary: 'Create a new song from YouTube URL' })
  @ApiResponse({
    status: 201,
    description: 'The song has been successfully created.',
    type: SongResponseDto,
  })
  @Post('youtube')
  async createFromYoutube(
    @CurrentUser() user: any,
    @Body() createSongDto: CreateSongYoutubeDto,
  ): Promise<SongResponseDto> {
    const song = await this.songService.createFromYoutube(
      user.id,
      createSongDto.url,
      createSongDto.title,
      createSongDto.artist,
      createSongDto.albumId,
    );
    return plainToInstance(SongResponseDto, song, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Get all songs' })
  @ApiResponse({
    status: 200,
    description: 'Return all songs.',
    type: [SongResponseDto],
  })
  @Get()
  async findAll(@CurrentUser() user: any): Promise<SongResponseDto[]> {
    const songs = await this.songService.findAll(user.id);
    return plainToInstance(SongResponseDto, songs, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Get a song by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the song.',
    type: SongResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Song not found.' })
  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<SongResponseDto> {
    const song = await this.songService.findOne(user.id, id);
    return plainToInstance(SongResponseDto, song, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Delete a song' })
  @ApiResponse({ status: 204, description: 'Song deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Song not found.' })
  @HttpCode(204)
  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<void> {
    await this.songService.remove(user.id, id);
  }

  @ApiOperation({ summary: 'Move a song to another album' })
  @ApiResponse({
    status: 200,
    description: 'Song moved successfully.',
    type: SongResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Song not found.' })
  @Patch(':id/move')
  async moveToAlbum(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('albumId') albumId: string,
  ): Promise<SongResponseDto> {
    const song = await this.songService.moveToAlbum(user.id, id, albumId);
    return plainToInstance(SongResponseDto, song, {
      excludeExtraneousValues: true,
    });
  }
}
