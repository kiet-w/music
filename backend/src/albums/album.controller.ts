import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { AlbumService } from './album.service';
import { AlbumResponseDto } from './dto/album-response.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

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
    @CurrentUser() user: AuthenticatedUser,
    @Body() createAlbumDto: CreateAlbumDto,
  ): Promise<AlbumResponseDto> {
    return this.albumService.create(user.id, createAlbumDto);
  }

  @ApiOperation({ summary: 'Get all albums' })
  @ApiResponse({
    status: 200,
    description: 'Return all albums with pagination.',
  })
  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.albumService.findAll(
      user.id,
      paginationDto.skip,
      paginationDto.take,
    );
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
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AlbumResponseDto> {
    return this.albumService.findOne(user.id, id);
  }
}
