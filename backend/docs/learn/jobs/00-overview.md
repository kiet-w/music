# Jobs Module Overview

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Pattern](#architecture-pattern)
3. [Directory Structure](#directory-structure)
4. [Component Overview](#component-overview)
5. [Key Features](#key-features)

---

## Introduction

The Jobs module is responsible for background job processing in the application. It handles:
- YouTube to MP3 conversion
- Scheduled cleanup tasks
- Queue monitoring and metrics
- Job retry logic and error handling

This module uses **BullMQ** (built on Redis) for reliable, scalable job processing with built-in retry logic and monitoring.

---

## Architecture Pattern

### Job Queue Pattern (BullMQ)

**Why BullMQ?**
- **Async Processing**: Long-running tasks don't block HTTP requests
- **Reliability**: Built-in retry logic with exponential backoff
- **Scalability**: Multiple workers can process jobs in parallel
- **Monitoring**: Built-in job status tracking and metrics
- **Deduplication**: Job IDs prevent duplicate processing

**Implementation Flow:**
```
Songs Module → BullMQ Queue → Redis → ConversionProcessor → Downloader/Storage → Database
```

**Job Lifecycle:**
1. **Enqueue**: Songs module adds job to queue
2. **Wait**: Job waits in Redis queue
3. **Process**: Worker picks up job and processes
4. **Retry**: On failure, job retries with backoff
5. **Complete**: Job marked as completed
6. **Cleanup**: Scheduled cleanup removes orphaned jobs

---

## Directory Structure

```
backend/src/jobs/
├── conversion.processor.ts  # BullMQ job processor
├── cleanup.service.ts       # Scheduled cleanup tasks
├── jobs.metrics.service.ts # Prometheus metrics
└── jobs.module.ts          # Module configuration
```

---

## Component Overview

### 1. JobsModule
**Purpose**: Configure BullMQ and job processing infrastructure

**Responsibilities:**
- Configure Redis connection
- Register BullMQ queues
- Configure default job options
- Register processors and services
- Set up Prometheus metrics

**See**: [Module Documentation](./01-module.md)

### 2. ConversionProcessor
**Purpose**: Process YouTube to MP3 conversion jobs

**Responsibilities:**
- Download audio from YouTube
- Convert to MP3 format
- Upload to Supabase Storage
- Update database with public URL
- Cleanup temporary files

**See**: [Processor Documentation](./02-conversion-processor.md)

### 3. CleanupService
**Purpose**: Scheduled cleanup of orphaned jobs and temp files

**Responsibilities:**
- Mark stuck jobs as failed
- Delete old temporary files
- Run on hourly schedule

**See**: [Cleanup Documentation](./03-cleanup-service.md)

### 4. JobsMetricsService
**Purpose**: Update Prometheus metrics for queue monitoring

**Responsibilities:**
- Track waiting jobs
- Track active jobs
- Track completed jobs
- Track failed jobs
- Update metrics every 10 seconds

**See**: [Metrics Documentation](./04-metrics-service.md)

---

## Key Features

### 1. Async Processing
- YouTube conversion happens in background
- HTTP request returns immediately
- User sees song right away, audio available when ready

### 2. Retry Logic
- Automatic retry on failure
- Exponential backoff (5s, 10s, 20s)
- Max 3 attempts by default

### 3. Job Deduplication
- Job IDs prevent duplicate processing
- Same YouTube ID = single job
- Saves bandwidth and storage

### 4. Streaming Upload
- Stream upload to avoid OOM
- Constant memory usage
- Handles large files (100MB+)

### 5. Scheduled Cleanup
- Hourly cleanup of orphaned jobs
- Hourly cleanup of temp files
- Prevents resource exhaustion

### 6. Monitoring
- Prometheus metrics for queue health
- Track waiting, active, completed, failed jobs
- Alert on queue backlog

---

## Technology Stack

### BullMQ
- **Purpose**: Job queue system
- **Backend**: Redis
- **Features**: Retry logic, job deduplication, metrics

### Redis
- **Purpose**: Message broker and job storage
- **Providers**: Local Redis, Upstash (cloud)
- **Configuration**: TLS for cloud providers

### yt-dlp
- **Purpose**: YouTube downloader
- **Features**: Download audio, extract metadata
- **Location**: Binary in backend directory

### Supabase Storage
- **Purpose**: Cloud storage for audio files
- **Features**: Public URLs, streaming upload
- **Bucket**: 'music'

### Prometheus
- **Purpose**: Metrics collection
- **Features**: Gauge metrics, time-series data
- **Integration**: @willsoto/nestjs-prometheus

---

## Configuration

### Redis Connection
```typescript
BullModule.forRoot({
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_HOST?.includes('upstash') ? {} : undefined
  }
})
```

### Queue Configuration
```typescript
BullModule.registerQueue({
  name: 'conversion',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
})
```

### Processor Concurrency
```typescript
@Processor('conversion', { concurrency: 2 })
```
- 2 concurrent jobs per worker
- Prevents server overload
- Balance speed and stability

---

## Job Flow

### Complete Flow
```
1. User requests YouTube song
   ↓
2. SongsController receives request
   ↓
3. CreateSongFromYoutubeHandler creates pending record
   ↓
4. Job enqueued to BullMQ with jobId: convert-{youtubeId}
   ↓
5. Job stored in Redis
   ↓
6. ConversionProcessor picks up job
   ↓
7. Download from YouTube to temp file
   ↓
8. Stream upload to Supabase Storage
   ↓
9. Get public URL
   ↓
10. Update database with URL
   ↓
11. Cleanup temp file
   ↓
12. Job marked as completed
```

### Error Flow
```
1. Job fails during processing
   ↓
2. Error logged
   ↓
3. Temp file cleaned up
   ↓
4. Job requeued with exponential backoff
   ↓
5. Retry after delay
   ↓
6. If max attempts reached, job marked as failed
   ↓
7. CleanupService marks as failed after 2 hours
```

---

## Related Documentation

- [Songs Module](../songs/00-overview.md) - Job enqueue logic
- [Integration Guide](../integration.md) - Songs & Jobs integration
- [Architecture Decisions](../architecture-decisions.md) - Design rationale

---

**Next**: [Module Documentation](./01-module.md)
