import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SongsService } from './songs.service';
import { CreateSongYoutubeDto } from './dto/create-song-youtube.dto';
import { MoveSongDto } from './dto/move-song.dto';
import { SongResponseDto } from './dto/song-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('songs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('songs')
@UseInterceptors(ClassSerializerInterceptor)
export class SongsController {
  constructor(private readonly songService: SongsService) {}

  @ApiOperation({ summary: 'Create a new song from YouTube URL' })
  @ApiResponse({
    status: 201,
    description: 'The song has been successfully created.',
    type: SongResponseDto,
  })
  @Post('youtube')
  @UseGuards(ThrottlerGuard)
  async createFromYoutube(
    @CurrentUser() user: any,
    @Body() dto: CreateSongYoutubeDto,
  ): Promise<SongResponseDto> {
    return this.songService.createFromYoutube(user.id, dto);
  }

  @ApiOperation({ summary: 'Get all songs' })
  @ApiResponse({
    status: 200,
    description: 'Return all songs with pagination.',
  })
  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.songService.findAll(user.id, paginationDto);
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
    return this.songService.findOne(user.id, id);
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
    @Body() dto: MoveSongDto,
  ): Promise<SongResponseDto> {
    return this.songService.moveToAlbum(user.id, id, dto);
  }
}
