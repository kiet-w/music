import {
  Controller,
  Delete,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { CleanupStorageDto } from '../dtos/cleanup-storage.dto';

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
