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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ThrottlerGuard } from '@nestjs/throttler';

import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('songs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('songs')
@UseInterceptors(ClassSerializerInterceptor)
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @ApiOperation({ summary: 'Get info from YouTube URL' })
  @ApiResponse({
    status: 200,
    description: 'Returns video title and artist',
  })
  @Get('youtube/info')
  @HttpCode(200)
  @ResponseMessage('Lấy thông tin YouTube thành công')
  async getYoutubeInfo(@Query('url') url: string) {
    return this.songsService.getYoutubeInfo(url);
  }

  @ApiOperation({ summary: 'Create a new song from YouTube URL' })
  @ApiResponse({
    status: 201,
    description: 'The song has been successfully created.',
    type: SongResponseDto,
  })
  @Post('youtube')
  @HttpCode(201)
  @ResponseMessage('Tải nhạc từ YouTube thành công')
  @UseGuards(ThrottlerGuard)
  async createFromYoutube(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSongYoutubeDto,
  ): Promise<SongResponseDto> {
    return this.songsService.createFromYoutube(user.id, dto);
  }

  @ApiOperation({ summary: 'Get all songs' })
  @ApiResponse({
    status: 200,
    description: 'Return all songs with pagination.',
  })
  @Get()
  @HttpCode(200)
  @ResponseMessage('Lấy danh sách bài hát thành công')
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.songsService.findAll(user.id, paginationDto);
  }

  @ApiOperation({ summary: 'Get a song by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the song.',
    type: SongResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Song not found.' })
  @Get(':id')
  @HttpCode(200)
  @ResponseMessage('Lấy chi tiết bài hát thành công')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<SongResponseDto> {
    return this.songsService.findOne(user.id, id);
  }

  @ApiOperation({ summary: 'Delete a song' })
  @ApiResponse({ status: 204, description: 'Song deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Song not found.' })
  @HttpCode(204)
  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.songsService.remove(user.id, id);
  }

  @ApiOperation({ summary: 'Move a song to another album' })
  @ApiResponse({
    status: 200,
    description: 'Song moved successfully.',
    type: SongResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Song not found.' })
  @Patch(':id/move')
  @HttpCode(200)
  @ResponseMessage('Di chuyển bài hát thành công')
  async moveToAlbum(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: MoveSongDto,
  ): Promise<SongResponseDto> {
    return this.songsService.moveToAlbum(user.id, id, dto);
  }
}
