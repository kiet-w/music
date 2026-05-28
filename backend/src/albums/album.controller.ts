import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { AlbumService } from './album.service';
import { AlbumResponseDto } from './dto/album-response.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('albums')
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
    @Body() createAlbumDto: CreateAlbumDto,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumService.create(createAlbumDto);
    return plainToInstance(AlbumResponseDto, album);
  }

  @ApiOperation({ summary: 'Get all albums' })
  @ApiResponse({
    status: 200,
    description: 'Return all albums.',
    type: [AlbumResponseDto],
  })
  @UseInterceptors(CacheInterceptor)
  @Get()
  async findAll(): Promise<AlbumResponseDto[]> {
    const albums = await this.albumService.findAll();
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
  async findOne(@Param('id') id: string): Promise<AlbumResponseDto> {
    const album = await this.albumService.findOne(id);
    return plainToInstance(AlbumResponseDto, album);
  }
}
