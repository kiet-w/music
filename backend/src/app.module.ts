import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './core/app.controller';
import { AppService } from './core/app.service';
import { DownloaderModule } from './downloader/downloader.module';
import { StorageModule } from './storage/storage.module';
import { JobsModule } from './jobs/jobs.module';
import { PrismaModule } from './prisma/prisma.module';
import { SongsModule } from './songs/songs.module';
import { AlbumsModule } from './albums/albums.module';
import { GoogleDriveModule } from './google-drive/google-drive.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds
    }),
    DownloaderModule,
    StorageModule,
    JobsModule,
    PrismaModule,
    SongsModule,
    AlbumsModule,
    GoogleDriveModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
