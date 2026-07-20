# JobsModule Documentation

## Overview
The `JobsModule` configures BullMQ for job processing, sets up Redis connection, registers queues, and configures Prometheus metrics for monitoring.

## File Location
`backend/src/jobs/jobs.module.ts`

## Module Configuration

```typescript
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_HOST?.includes('upstash') ? {} : undefined
      },
    }),
    BullModule.registerQueue({
      name: 'conversion',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
    DownloaderModule,
    StorageModule,
  ],
  providers: [
    ConversionProcessor,
    CleanupService,
    makeGaugeProvider({
      name: 'bullmq_queue_jobs_waiting',
      help: 'Number of jobs waiting in the queue',
      labelNames: ['queue'],
    }),
    makeGaugeProvider({
      name: 'bullmq_queue_jobs_active',
      help: 'Number of jobs currently active in the queue',
      labelNames: ['queue'],
    }),
    makeGaugeProvider({
      name: 'bullmq_queue_jobs_completed',
      help: 'Number of jobs completed in the queue',
      labelNames: ['queue'],
    }),
    makeGaugeProvider({
      name: 'bullmq_queue_jobs_failed',
      help: 'Number of jobs failed in the queue',
      labelNames: ['queue'],
    }),
    JobsMetricsService,
  ],
  exports: [BullModule],
})
export class JobsModule {}
```

---

## BullMQ Configuration

### forRoot (Global Configuration)

```typescript
BullModule.forRoot({
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_HOST?.includes('upstash') ? {} : undefined
  },
})
```

**Purpose**: Configure global Redis connection for all queues

**Configuration Options:**

#### host
```typescript
host: process.env.REDIS_HOST || 'localhost'
```
- **Environment Variable**: `REDIS_HOST`
- **Default**: `localhost`
- **Purpose**: Redis server hostname
- **Examples**: `localhost`, `redis.example.com`, `xxx.upstash.io`

#### port
```typescript
port: parseInt(process.env.REDIS_PORT || '6379')
```
- **Environment Variable**: `REDIS_PORT`
- **Default**: `6379`
- **Purpose**: Redis server port
- **Examples**: `6379`, `6380`

#### password
```typescript
password: process.env.REDIS_PASSWORD
```
- **Environment Variable**: `REDIS_PASSWORD`
- **Default**: undefined (no password)
- **Purpose**: Redis authentication password
- **Required for**: Production Redis instances

#### tls
```typescript
tls: process.env.REDIS_HOST?.includes('upstash') ? {} : undefined
```
- **Purpose**: Enable TLS for secure connections
- **Condition**: Only for Upstash (cloud Redis)
- **Why**: Upstash requires TLS for security

**Why conditional TLS?**
- Local Redis: No TLS needed
- Upstash: TLS required
- Automatic detection based on hostname

---

### registerQueue (Queue Configuration)

```typescript
BullModule.registerQueue({
  name: 'conversion',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
})
```

**Purpose**: Register the 'conversion' queue with default options

**Queue Name**: `conversion`

**Default Job Options:**

#### attempts
```typescript
attempts: 3
```
- **Purpose**: Maximum retry attempts
- **Default**: 3
- **Behavior**: Job retried up to 3 times on failure

#### backoff.type
```typescript
backoff: { type: 'exponential' }
```
- **Purpose**: Retry strategy
- **Value**: `exponential`
- **Behavior**: Delay increases exponentially between retries

#### backoff.delay
```typescript
backoff: { delay: 5000 }
```
- **Purpose**: Initial delay in milliseconds
- **Value**: `5000` (5 seconds)
- **Behavior**: First retry after 5 seconds, then 10s, 20s

**Retry Timeline:**
```
Attempt 1: Immediate
Attempt 2: 5 seconds later
Attempt 3: 10 seconds later
Failed after 3 attempts
```

---

## Module Imports

### DownloaderModule
```typescript
import { DownloaderModule } from '../downloader/downloader.module';
```

**Purpose**: YouTube download functionality

**Provides:**
- `DownloaderService` - Download audio from YouTube

**Usage in Processor:**
```typescript
constructor(private readonly downloaderService: DownloaderService) {}
```

### StorageModule
```typescript
import { StorageModule } from '../storage/storage.module';
```

**Purpose**: Supabase storage functionality

**Provides:**
- `StorageService` - Upload files to Supabase

**Usage in Processor:**
```typescript
constructor(private readonly storageService: StorageService) {}
```

---

## Providers

### ConversionProcessor
```typescript
providers: [ConversionProcessor]
```

**Purpose**: Process conversion jobs

**Decorator:**
```typescript
@Processor('conversion', { concurrency: 2 })
```

**See**: [Processor Documentation](./02-conversion-processor.md)

---

### CleanupService
```typescript
providers: [CleanupService]
```

**Purpose**: Scheduled cleanup of orphaned jobs and temp files

**Schedule:**
```typescript
@Cron(CronExpression.EVERY_HOUR)
```

**See**: [Cleanup Documentation](./03-cleanup-service.md)

---

### Prometheus Gauges

```typescript
makeGaugeProvider({
  name: 'bullmq_queue_jobs_waiting',
  help: 'Number of jobs waiting in the queue',
  labelNames: ['queue'],
})
```

**Purpose**: Define Prometheus gauge metrics

**Metrics:**

1. **bullmq_queue_jobs_waiting**
   - **Help**: Number of jobs waiting in the queue
   - **Label**: queue name
   - **Use**: Monitor queue backlog

2. **bullmq_queue_jobs_active**
   - **Help**: Number of jobs currently active
   - **Label**: queue name
   - **Use**: Monitor worker utilization

3. **bullmq_queue_jobs_completed**
 success rate

4. **bullmq_queue_jobs_failed**
   - **Help**: Number of jobs failed
   - **Label**: queue name
   - **Use**: Monitor error rate

**Why Gauges?**
- Gauges represent current state (not cumulative)
- Can go up and down
- Perfect for queue metrics

---

### JobsMetricsService
```typescript
providers: [JobsMetricsService]
```

**Purpose**: Update Prometheus metrics every 10 seconds

**Schedule:**
```typescript
@Cron(CronExpression.EVERY_10_SECONDS)
```

**See**: [Metrics Documentation](./04-metrics-service.md)

---

## Module Exports

```typescript
exports: [BullModule]
```

**Purpose**: Export BullModule for use in other modules

**Usage in SongsModule:**
```typescript
@Module({
  imports: [JobsModule], // Imports BullModule
  providers: [
    CreateSongFromYoutubeHandler,
    @InjectQueue('conversion') private readonly conversionQueue: Queue
  ]
})
```

**Why Export?**
- Allows SongsModule to inject queues
- Enables job enqueueing from other modules
- Maintains module boundaries

---

## Environment Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `REDIS_HOST` | Redis hostname | `localhost` | `redis.example.com` |
| `REDIS_PORT` | Redis port | `6379` | `6379` |
| `REDIS_PASSWORD` | Redis password | undefined | `my-secret-password` |

### Example .env
```bash
# Local Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Upstash (Cloud Redis)
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxx
```

---

## Redis Providers

### Local Redis
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis

# Check status
sudo systemctl status redis
```

**Configuration:**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Upstash (Cloud Redis)
```bash
# Sign up at upstash.com
# Create Redis database
# Copy connection details
```

**Configuration:**
```bash
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxx
```

**Benefits:**
- Managed service
- Automatic TLS
- High availability
- Free tier available

---

## Testing

### Unit Tests
```typescript
describe('JobsModule', () => {
  it('should compile module', async () => {
    const module = await Test.createTestingModule({
      imports: [JobsModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide ConversionProcessor', async () => {
    const module = await Test.createTestingModule({
      imports: [JobsModule],
    }).compile();

    const processor = module.get<ConversionProcessor>(ConversionProcessor);
    expect(processor).toBeDefined();
  });
});
```

### Integration Tests
```typescript
describe('JobsModule Integration', () => {
  it('should connect to Redis', async () => {
    const module = await Test.createTestingModule({
      imports: [JobsModule],
    }).compile();

    const queue = module.get<Queue>('conversion');
    const jobCounts = await queue.getJobCounts();
    expect(jobCounts).toBeDefined();
  });
});
```

---

## Troubleshooting

### Redis Connection Failed
**Error**: `Error: connect ECONNREFUSED`

**Solutions:**
1. Check Redis is running: `sudo systemctl status redis`
2. Verify REDIS_HOST and REDIS_PORT
3. Check firewall settings
4. Test connection: `redis-cli -h localhost -p 6379 ping`

### TLS Error with Upstash
**Error**: `Error: self signed certificate`

**Solutions:**
1. Ensure TLS is enabled for Upstash
2. Check hostname contains 'upstash'
3. Verify Upstash credentials

### Queue Not Processing
**Error**: Jobs stuck in 'waiting' state

**Solutions:**
1. Check ConversionProcessor is registered
2. Verify worker is running
3. Check processor concurrency setting
4. Review processor logs for errors

---

## Related Documentation

- [Processor Documentation](./02-conversion-processor.md) - Job processing logic
- [Cleanup Documentation](./03-cleanup-service.md) - Scheduled cleanup
- [Metrics Documentation](./04-metrics-service.md) - Prometheus metrics
- [Songs Module](../songs/00-overview.md) - Job enqueue logic

---

**Previous**: [Overview](./00-overview.md)  
**Next**: [Processor Documentation](./02-conversion-processor.md)
