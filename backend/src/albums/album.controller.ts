import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlbumService } from './album.service';
import { AlbumResponseDto } from './dto/album-response.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('albums')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('albums')
@UseInterceptors(ClassSerializerInterceptor)
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @ApiOperation({ summary: 'Create a new album' })
  @ApiResponse({
    status: 201,
    description: 'The album has been successfully created.',
    type: AlbumResponseDto,
  })
  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() createAlbumDto: CreateAlbumDto,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumService.create(user.id, createAlbumDto);
    return plainToInstance(AlbumResponseDto, album);
  }

  @ApiOperation({ summary: 'Get all albums' })
  @ApiResponse({
    status: 200,
    description: 'Return all albums.',
    type: [AlbumResponseDto],
  })
  @Get()
  async findAll(@CurrentUser() user: any): Promise<AlbumResponseDto[]> {
    const albums = await this.albumService.findAll(user.id);
    return plainToInstance(AlbumResponseDto, albums);
  }

  @ApiOperation({ summary: 'Get an album by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the album.',
    type: AlbumResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Album not found.' })
  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumService.findOne(user.id, id);
    return plainToInstance(AlbumResponseDto, album);
  }
}
