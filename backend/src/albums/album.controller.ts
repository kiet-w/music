import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
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
import { UpdateAlbumDto } from './dto/update-album.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { ResponseMessage } from '../common/decorators/response-message.decorator';

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
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Tạo album thành công')
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createAlbumDto: CreateAlbumDto,
  ): Promise<AlbumResponseDto> {
    return this.albumService.create(user.id, createAlbumDto);
  }

  @ApiOperation({ summary: 'Get all albums for current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all albums with pagination.',
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Lấy danh sách album thành công')
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit || '50', 10) || 50), 100);
    const skip = (pageNum - 1) * limitNum;
    return this.albumService.findAll(user.id, skip, limitNum);
  }

  @ApiOperation({ summary: 'Get an album by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the album.',
    type: AlbumResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Album not found.' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Lấy chi tiết album thành công')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AlbumResponseDto> {
    return this.albumService.findOne(user.id, id);
  }

  @ApiOperation({ summary: 'Update an album by ID' })
  @ApiResponse({
    status: 200,
    description: 'The album has been successfully updated.',
    type: AlbumResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Album not found.' })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Cập nhật album thành công')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateAlbumDto: UpdateAlbumDto,
  ): Promise<AlbumResponseDto> {
    return this.albumService.update(user.id, id, updateAlbumDto);
  }

  @ApiOperation({ summary: 'Delete an album by ID' })
  @ApiResponse({
    status: 200,
    description: 'The album has been successfully deleted.',
  })
  @ApiResponse({ status: 400, description: 'Cannot delete default album.' })
  @ApiResponse({ status: 404, description: 'Album not found.' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Xóa album thành công')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.albumService.remove(user.id, id);
  }
}
