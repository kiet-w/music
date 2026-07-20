# CleanupService Documentation

## Overview
The `CleanupService` is a scheduled service that performs cleanup tasks to maintain system health. It runs hourly to clean up orphaned jobs and temporary files.

## File Location
`backend/src/jobs/cleanup.service.ts`

## Service Configuration

```typescript
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appLogger: AppLogger,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron()
}
```

### Schedule
```typescript
@Cron(CronExpression.EVERY_HOUR)
```

**Purpose**: Run cleanup every hour

**Cron Expression**: `0 * * * *` (every hour at minute 0)

**Why Hourly?**
- Balance between cleanliness and performance
- Frequent enough to prevent accumulation
- Not too frequent to impact server load

---

## Main Handler

```typescript
@Cron(CronExpression.EVERY_HOUR)
async handleCron() {
  this.appLogger.startSection('Cleanup Cron', 'cleanup-job');
  try {
    await this.cleanupOrphanedJobs();
    await this.cleanupTempFiles();
  } catch (error) {
    this.appLogger.processError('Cleanup Cron', error, 'Cleanup Processing');
  } finally {
    this.appLogger.endSection('Cleanup Cron', 'cleanup-job');
  }
}
```

**Flow:**
1. Start logging section
2. Clean up orphaned jobs
3. Clean up temp files
4. Handle errors gracefully
5. End logging section (always runs)

---

## Orphaned Jobs Cleanup

```typescript
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
```

### Purpose
Mark stuck jobs as failed to prevent queue backlog.

### Threshold
```typescript
const thresholdDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
```

**Value**: 2 hours ago

**Why 2 Hours?**
- YouTube conversion typically takes < 5 minutes
- 2 hours is generous buffer for network issues
- Prevents stuck jobs from accumulating indefinitely

### Query Conditions
```typescript
where: {
  status: {
    in: [JobStatus.PROCESSING, JobStatus.PENDING],
  },
  updatedAt: {
    lt: thresholdDate,
  },
}
```

**Filters:**
- Status is `PROCESSING` or `PENDING`
- Not updated in the last 2 hours

### Update
```typescript
data: {
  status: JobStatus.FAILED,
  errorMessage: 'Job timed out and was cleaned up by system',
}
```

**Changes:**
- Mark status as `FAILED`
- Add error message for context

**Why Mark as Failed?**
- Allows users to retry
- Keeps database clean
- Provides audit trail

---

## Temp Files Cleanup

```typescript
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
```

### Purpose
Delete old temporary files to free disk space.

### Directories
```typescript
const dirsToSweep = [path.join(process.cwd(), 'temp')];
```

**Directory**: `temp/` (relative to project root)

**Why Single Directory?**
- All temp files go to one place
- Easy to manage
- Future: Add more directories if needed

### Threshold
```typescript
const oneHourAgo = Date.now() - 60 * 60 * 1000;
```

**Value**: 1 hour ago

**Why 1 Hour?**
- Active conversions should complete within 1 hour
- Prevents deletion of files in use
- Frees disk space regularly

### File Filters
```typescript
if (!file.endsWith('.mp3') && !file.endsWith('.part')) {
  continue;
}
```

**Extensions:**
- `.mp3` - Completed audio files
- `.part` - Partial download files

**Why These Extensions?**
- Only cleanup audio-related files
- Ignore other files in temp directory
- Prevents accidental deletion

### Deletion Logic
```typescript
const stats = fs.statSync(filePath);
if (stats.mtimeMs < oneHourAgo) {
  fs.unlinkSync(filePath);
  deletedCount++;
}
```

**Check:**
- Get file modification time
- Compare to threshold (1 hour ago)
- Delete if older than threshold

**Why Modification Time?**
- Indicates when file was last touched
- Active files are updated during processing
- Old files are likely abandoned

### Error Handling
```typescript
try {
  const stats = fs.statSync(filePath);
  if (stats.mtimeMs < oneHourAgo) {
    fs.unlinkSync(filePath);
    deletedCount++;
  }
} catch (fileErr) {
  this.logger.warn(`Failed to process file ${filePath}: ${fileErr.message}`);
}
```

**Catches:**
- File not found (deleted by another process)
- Permission errors
- File system errors

**Behavior:**
- Log warning
- Continue with next file
- Don't fail entire cleanup

---

## Error Handling

### Main Handler
```typescript
try {
  await this.cleanupOrphanedJobs();
  await this.cleanupTempFiles();
} catch (error) {
  this.appLogger.processError('Cleanup Cron', error, 'Cleanup Processing');
} finally {
  this.appLogger.endSection('Cleanup Cron', 'cleanup-job');
}
```

**Behavior:**
- Catch any errors
- Log error with context
- Always run finally block
- Don't crash the service

### Individual Methods
```typescript
try {
  const files = fs.readdirSync(dir);
  // ... process files
} catch (dirErr) {
  this.logger.warn(`Failed to read directory ${dir}: ${dirErr.message}`);
}
```

**Behavior:**
- Catch directory read errors
- Log warning
- Continue with next directory

---

## Logging

### AppLogger Usage
```typescript
this.appLogger.startSection('Cleanup Cron', 'cleanup-job');
this.appLogger.step('Cleaning up orphaned jobs');
this.appLogger.step('Cleaning up temp files');
this.appLogger.endSection('Cleanup Cron', 'cleanup-job');
```

**Benefits:**
- Structured logging
- Clear operation boundaries
- Easy debugging
- Performance tracking

### Logger Usage
```typescript
this.logger.log(`Cleaned up ${result.count} orphaned jobs`);
this.logger.log(`Cleaned up ${deletedCount} temporary files`);
this.logger.warn(`Failed to process file ${filePath}: ${fileErr.message}`);
```

**Levels:**
- `log` - Informational
- `warn` - Non-critical issues

---

## Dependencies

### Constructor
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly appLogger: AppLogger,
) {}
```

**Dependencies:**
- `PrismaService` - Database operations
- `AppLogger` - Structured logging

---

## Performance Impact

### Orphaned Jobs
- **Database Query**: Single updateMany
- **Impact**: Minimal (indexed query)
- **Frequency**: Hourly

### Temp Files
- **File System**: Directory scan + file deletion
- **Impact**: Low (only temp directory)
- **Frequency**: Hourly

### Overall
- **CPU**: Minimal
- **Memory**: Minimal
- **Disk**: Frees space
- **Network**: None

---

## Configuration

### Schedule
```typescript
@Cron(CronExpression.EVERY_HOUR)
```

**Alternative Schedules:**
```typescript
// Every 30 minutes
@Cron(CronExpression.EVERY_30_MINUTES)

// Every 6 hours
@Cron(CronExpression.EVERY_6_HOURS)

// Daily at midnight
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
```

### Thresholds
```typescript
// Jobs threshold (2 hours)
const thresholdDate = new Date(Date.now() - 2 * 60 * 60 * 1000);

// Files threshold (1 hour)
const oneHourAgo = Date.now() - 60 * 60 * 1000;
```

**Customization:**
- Adjust based on typical job duration
- Adjust based on disk space requirements
- Adjust based on cleanup frequency

---

## Testing

### Unit Tests
```typescript
describe('CleanupService', () => {
  let service: CleanupService;
  let prisma: PrismaService;
  let appLogger: AppLogger;

  beforeEach(() => {
    prisma = { downloadJob: { updateMany: jest.fn() } } as any;
    appLogger = { startSection: jest.fn(), step: jest.fn(), endSection: jest.fn() } as any;
    service = new CleanupService(prisma, appLogger);
  });

  it('should clean up orphaned jobs', async () => {
    prisma.downloadJob.updateMany.mockResolvedValue({ count: 5 });

    await service.cleanupOrphanedJobs();

    expect(prisma.downloadJob.updateMany).toHaveBeenCalledWith({
      where: {
        status: { in: [JobStatus.PROCESSING, JobStatus.PENDING] },
        updatedAt: { lt: expect.any(Date) }
      },
      data: {
        status: JobStatus.FAILED,
        errorMessage: 'Job timed out and was cleaned up by system'
      }
    });
  });

  it('should clean up temp files', async () => {
    // Mock fs operations
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['test.mp3']);
    jest.spyOn(fs, 'statSync').mockReturnValue({ mtimeMs: Date.now() - 2 * 60 * 60 * 1000 });
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

    await service.cleanupTempFiles();

    expect(fs.unlinkSync).toHaveBeenCalled();
  });
});
```

---

## Troubleshooting

### Jobs Not Being Cleaned Up
**Symptom**: Stuck jobs remain in database

**Solutions:**
1. Check cron schedule is running
2. Verify threshold is appropriate
3. Check database connection
4. Review service logs

### Temp Files Not Being Deleted
**Symptom**: Temp directory fills up

**Solutions:**
1. Check temp directory path is correct
2. Verify file permissions
3. Check threshold is appropriate
4. Review service logs

### Service Not Running
**Symptom**: No cleanup logs

**Solutions:**
1. Check @nestjs/schedule is configured
2. Verify service is registered in module
3. Check cron expression is valid
4. Review NestJS logs

---

## Related Documentation

- [Module Documentation](./01-module.md) - Module configuration
- [Processor Documentation](./02-conversion-processor.md) - Job processing
- [Metrics Documentation](./04-metrics-service.md) - Queue monitoring

---

**Previous**: [Processor Documentation](./02-conversion-processor.md)  
**Next**: [Metrics Documentation](./04-metrics-service.md)
