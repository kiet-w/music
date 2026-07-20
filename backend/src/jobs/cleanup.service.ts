import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app.logger';
import { JobStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appLogger: AppLogger,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.appLogger.startSection('Cleanup Cron', 'cleanup-job');
    try {
      await this.cleanupOrphanedJobs();
      await this.cleanupTempFiles();
      await this.cleanupExpiredTokens();
    } catch (error) {
      this.appLogger.processError('Cleanup Cron', error, 'Cleanup Processing');
    } finally {
      this.appLogger.endSection('Cleanup Cron', 'cleanup-job');
    }
  }

  private async cleanupOrphanedJobs() {
    this.appLogger.step('Cleaning up orphaned jobs');
    // Jobs stuck in PROCESSING or PENDING for more than 2 hours
    const thresholdDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await this.prisma.downloadJob.updateMany({
      where: {
        status: {
          in: [JobStatus.PROCESSING, JobStatus.PENDING],
        },
        updatedAt: {
          lt: thresholdDate,
        },
      },
      data: {
        status: JobStatus.FAILED,
        errorMessage: 'Job timed out and was cleaned up by system',
      },
    });

    this.logger.log(`Cleaned up ${result.count} orphaned jobs`);
  }

  private async cleanupTempFiles() {
    this.appLogger.step('Cleaning up temp files');

    const dirsToSweep = [path.join(process.cwd(), 'temp')];

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    let deletedCount = 0;

    for (const dir of dirsToSweep) {
      if (!fs.existsSync(dir)) {
        continue;
      }

      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (!file.endsWith('.mp3') && !file.endsWith('.part')) {
            continue;
          }

          const filePath = path.join(dir, file);
          try {
            const stats = fs.statSync(filePath);
            if (stats.mtimeMs < oneHourAgo) {
              fs.unlinkSync(filePath);
              deletedCount++;
            }
          } catch (fileErr) {
            this.logger.warn(
              `Failed to process file ${filePath}: ${fileErr.message}`,
            );
          }
        }
      } catch (dirErr) {
        this.logger.warn(`Failed to read directory ${dir}: ${dirErr.message}`);
      }
    }

    this.logger.log(`Cleaned up ${deletedCount} temporary files`);
  }

  private async cleanupExpiredTokens() {
    this.appLogger.step('Cleaning up expired refresh tokens');
    const thresholdDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { 
            isRevoked: true, 
            updatedAt: { lt: thresholdDate }
          }
        ]
      }
    });

    this.logger.log(`Cleaned up ${result.count} expired/revoked refresh tokens`);
  }
}
