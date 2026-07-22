import {
  Controller,
  Delete,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { CleanupStorageDto } from '../dtos/cleanup-storage.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Delete('tracks/:id')
  async deleteTrack(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.logger.warn(
      {
        adminUserId: user.id,
        deletedTrackId: id,
        action: 'ADMIN_DELETE_TRACK',
      },
      'Admin deleted track',
    );
    return this.adminService.deleteTrack(id);
  }

  @Post('storage/cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanupStorage(
    @Body() cleanupDto: CleanupStorageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.warn(
      { adminUserId: user.id, action: 'ADMIN_STORAGE_CLEANUP' },
      'Admin triggered storage cleanup',
    );
    return this.adminService.cleanupStorage(cleanupDto);
  }
}
