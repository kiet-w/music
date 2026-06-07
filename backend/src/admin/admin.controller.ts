import {
  Controller,
  Delete,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { AdminService } from './admin.service';

/**
 * DTO cho việc dọn dẹp storage.
 * Được định nghĩa tại đây vì chỉ dùng trong AdminController (Quy tắc 4).
 */
export class CleanupStorageDto {
  @IsString()
  @IsNotEmpty()
  bucketName: string;

  @IsString()
  @IsNotEmpty()
  path: string;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete('tracks/:id')
  async deleteTrack(@Param('id') id: string) {
    return this.adminService.deleteTrack(id);
  }

  @Post('storage/cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanupStorage(@Body() cleanupDto: CleanupStorageDto) {
    return this.adminService.cleanupStorage(cleanupDto);
  }
}
