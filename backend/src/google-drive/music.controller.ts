import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoogleDriveService } from './google-drive.service';
import { ImportDto } from './dto/import.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('music')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('music')
export class MusicController {
  constructor(private readonly googleDriveService: GoogleDriveService) {}

  @Post('import')
  @ApiOperation({ summary: 'Import a file from Google Drive' })
  async importFile(@CurrentUser() user: any, @Body() importDto: ImportDto) {
    return await this.googleDriveService.importFile(user.id, importDto);
  }
}
