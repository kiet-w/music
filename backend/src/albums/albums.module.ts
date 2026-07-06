import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlbumController } from './album.controller';
import { AlbumService } from './album.service';
import { AlbumRepository } from './repositories/album.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AlbumController],
  providers: [AlbumService, AlbumRepository],
  exports: [AlbumService, AlbumRepository],
})
export class AlbumsModule {}
