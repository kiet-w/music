import {
  Controller,
  Delete,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { CleanupStorageDto } from '../dtos/cleanup-storage.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
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
