# JobsMetricsService Documentation

## Overview
The `JobsMetricsService` updates Prometheus metrics for the BullMQ queue. It runs every 10 seconds to track queue health and job status.

## File Location
`backend/src/jobs/jobs.metrics.service.ts`

## Service Configuration

```typescript
@Injectable()
export class JobsMetricsService {
  private readonly logger = new Logger(JobsMetricsService.name);

  constructor(
    @InjectQueue('conversion') private readonly conversionQueue: Queue,
    @InjectMetric('bullmq_queue_jobs_waiting')
    private readonly waitingGauge: Gauge<string>,
    @InjectMetric('bullmq_queue_jobs_active')
    private readonly activeGauge: Gauge<string>,
    @InjectMetric('bullmq_queue_jobs_completed')
    private readonly completedGauge: Gauge<string>,
    @InjectMetric('bullmq_queue_jobs_failed')
    private readonly failedGauge: Gauge<string>,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async updateMetrics()
}
```

### Schedule
```typescript
@Cron(CronExpression.EVERY_10_SECONDS)
```

**Purpose**: Update metrics every 10 seconds

**Cron Expression**: `*/10 * * * * *` (every 10 seconds)

**Why 10 Seconds?**
- Near real-time monitoring
- Not too frequent to impact performance
- Standard monitoring interval
- Balances freshness and overhead

---

## Dependencies

### Constructor
```typescript
constructor(
  @InjectQueue('conversion') private readonly conversionQueue: Queue,
  @InjectMetric('bullmq_queue_jobs_waiting')
  private readonly waitingGauge: Gauge<string>,
  @InjectMetric('bullmq_queue_jobs_active')
  private readonly activeGauge: Gauge<string>,
  @InjectMetric('bullmq_queue_jobs_completed')
  private readonly completedGauge: Gauge<string>,
  @InjectMetric('bullmq_queue_jobs_failed')
  private readonly failedGauge: Gauge<string>,
) {}
```

**Dependencies:**
- `conversionQueue` - BullMQ queue instance
- `waitingGauge` - Prometheus gauge for waiting jobs
- `activeGauge` - Prometheus gauge for active jobs
- `completedGauge` - Prometheus gauge for completed jobs
- `failedGauge` - Prometheus gauge for failed jobs

---

## Update Metrics Method

```typescript
@Cron(CronExpression.EVERY_10_SECONDS)
async updateMetrics() {
  try {
    const counts = await this.conversionQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
    );
    const queueName = this.conversionQueue.name;

    this.waitingGauge.set({ queue: queueName }, counts.waiting);
    this.activeGauge.set({ queue: queueName }, counts.active);
    this.completedGauge.set({ queue: queueName }, counts.completed);
    this.failedGauge.set({ queue: queueName }, counts.failed);
  } catch (error) {
    this.logger.error('Failed to update BullMQ metrics', error);
  }
}
```

### Step-by-Step

#### 1. Get Job Counts
```typescript
const counts = await this.conversionQueue.getJobCounts(
  'waiting',
  'active',
  'completed',
  'failed',
);
```

**Purpose**: Retrieve current job counts from BullMQ

**Returns:**
```typescript
{
  waiting: number,
  active: number,
  completed: number,
  failed: number
}
```

**Job States:**
- **waiting**: Jobs waiting to be processed
- **active**: Jobs currently being processed
- **completed**: Jobs that finished successfully
- **failed**: Jobs that failed after all retries

#### 2. Get Queue Name
```typescript
const queueName = this.conversionQueue.name;
```

**Purpose**: Get queue name for metric labels

**Value**: `'conversion'`

#### 3. Update Gauges
```typescript
this.waitingGauge.set({ queue: queueName }, counts.waiting);
this.activeGauge.set({ queue: queueName }, counts.active);
this.completedGauge.set({ queue: queueName }, counts.completed);
this.failedGauge.set({ queue: queueName }, counts.failed);
```

**Purpose**: Update Prometheus gauges with current counts

**Labels:**
- `queue`: Queue name (e.g., 'conversion')

**Values:**
- Current job counts

---

## Metrics

### bullmq_queue_jobs_waiting
```typescript
@InjectMetric('bullmq_queue_jobs_waiting')
private readonly waitingGauge: Gauge<string>
```

**Purpose**: Track number of jobs waiting in queue

**Label**: `queue` - Queue name

**Use Cases:**
- Monitor queue backlog
- Alert on high queue size
- Scale workers based on backlog

**Alerting Example:**
```yaml
- alert: HighQueueBacklog
  expr: bullmq_queue_jobs_waiting{queue="conversion"} > 100
  for: 5m
  annotations:
    summary: "High queue backlog detected"
```

---

### bullmq_queue_jobs_active
```typescript
@InjectMetric('bullmq_queue_jobs_active')
private readonly activeGauge: Gauge<string>
```

**Purpose**: Track number of jobs currently being processed

**Label**: `queue` - Queue name

**Use Cases:**
- Monitor worker utilization
- Detect stuck workers
- Alert on zero active jobs

**Alerting Example:**
```yaml
- alert: NoActiveJobs
  expr: bullmq_queue_jobs_active{queue="conversion"} == 0
  for: 10m
  annotations:
    summary: "No jobs being processed"
```

---

### bullmq_queue_jobs_completed
```typescript
@InjectMetric('bullmq_queue_jobs_completed')
private readonly completedGauge: Gauge<string>
```

**Purpose**: Track number of completed jobs

**Label**: `queue` - Queue name

**Use Cases:**
- Calculate success rate
- Monitor throughput
- Track job completion rate

**Note**: This is a gauge (current value), not a counter (cumulative). BullMQ doesn't provide cumulative counts by default.

---

### bullmq_queue_jobs_failed
```typescript
@InjectMetric('bullmq_queue_jobs_failed')
private readonly failedGauge: Gauge<string>
```

**Purpose**: Track number of failed jobs

**Label**: `queue` - Queue name

**Use Cases:**
- Monitor error rate
- Detect service degradation
- Alert on high failure rate

**Alerting Example:**
```yaml
- alert: HighFailureRate
  expr: rate(bullmq_queue_jobs_failed{queue="conversion"}[5m]) > 0.1
  annotations:
    summary: "High job failure rate detected"
```

---

## Error Handling

```typescript
try {
  // Update metrics
} catch (error) {
  this.logger.error('Failed to update BullMQ metrics', error);
}
```

**Behavior:**
- Catch any errors
- Log error with context
- Don't crash the service
- Continue running (next cron will retry)

**Common Errors:**
- Redis connection failure
- Queue not found
- Network issues

---

## Prometheus Integration

### Gauge Provider Definition
**In JobsModule:**
```typescript
makeGaugeProvider({
  name: 'bullmq_queue_jobs_waiting',
  help: 'Number of jobs waiting in the queue',
  labelNames: ['queue'],
})
```

**Purpose**: Define Prometheus gauge metric

**Properties:**
- `name`: Metric name
- `help`: Metric description
- `labelNames`: Label names for dimensions

### Metric Endpoint
Prometheus metrics are exposed at `/metrics` endpoint (configured in main app).

**Example Output:**
```
# HELP bullmq_queue_jobs_waiting Number of jobs waiting in the queue
# TYPE bullmq_queue_jobs_waiting gauge
bullmq_queue_jobs_waiting{queue="conversion"} 5

# HELP bullmq_queue_jobs_active Number of jobs currently active in the queue
# TYPE bullmq_queue_jobs_active gauge
bullmq_queue_jobs_active{queue="conversion"} 2

# HELP bullmq_queue_jobs_completed Number of jobs completed in the queue
# TYPE bullmq_queue_jobs_completed gauge
bullmq_queue_jobs_completed{queue="conversion"} 150

# HELP bullmq_queue_jobs_failed Number of jobs failed in the queue
# TYPE bullmq_queue_jobs_failed gauge
bullmq_queue_jobs_failed{queue="conversion"} 3
```

---

## Grafana Dashboard

### Example Queries

**Queue Backlog:**
```
bullmq_queue_jobs_waiting{queue="conversion"}
```

**Worker Utilization:**
```
bullmq_queue_jobs_active{queue="conversion"}
```

**Success Rate:**
```
rate(bullmq_queue_jobs_completed{queue="conversion"}[5m])
```

**Failure Rate:**
```
rate(bullmq_queue_jobs_failed{queue="conversion"}[5m])
```

**Total Jobs:**
```
sum(bullmq_queue_jobs_waiting{queue="conversion"}) + 
sum(bullmq_queue_jobs_active{queue="conversion"}) + 
sum(bullmq_queue_jobs_completed{queue="conversion"}) + 
sum(bullmq_queue_jobs_failed{queue="conversion"})
```

---

## Performance Impact

### CPU Usage
- **Minimal**: Simple query to Redis
- **Frequency**: Every 10 seconds
- **Impact**: Negligible

### Memory Usage
- **Minimal**: No data retention
- **Impact**: Negligible

### Network Usage
- **Minimal**: Small query to Redis
- **Frequency**: Every 10 seconds
- **Impact**: Negligible

---

## Configuration

### Schedule
```typescript
@Cron(CronExpression.EVERY_10_SECONDS)
```

**Alternative Schedules:**
```typescript
// Every 5 seconds (more frequent)
@Cron('*/5 * * * * *')

// Every 30 seconds (less frequent)
@Cron(CronExpression.EVERY_30_SECONDS)

// Every minute (least frequent)
@Cron(CronExpression.EVERY_MINUTE)
```

### Metrics
Add more metrics by:
1. Define gauge in JobsModule
2. Inject in constructor
3. Update in updateMetrics()

**Example - Add Delayed Jobs:**
```typescript
// In JobsModule
makeGaugeProvider({
  name: 'bullmq_queue_jobs_delayed',
  help: 'Number of delayed jobs',
  labelNames: ['queue'],
})

// In Service
@InjectMetric('bullmq_queue_jobs_delayed')
private readonly delayedGauge: Gauge<string>

// In updateMetrics()
const counts = await this.conversionQueue.getJobCounts(
  'waiting', 'active', 'completed', 'failed', 'delayed'
);
this.delayedGauge.set({ queue: queueName }, counts.delayed);
```

---

## Testing

### Unit Tests
```typescript
describe('JobsMetricsService', () => {
  let service: JobsMetricsService;
  let conversionQueue: Queue;
  let waitingGauge: Gauge;
  let activeGauge: Gauge;
  let completedGauge: Gauge;
  let failedGauge: Gauge;

  beforeEach(() => {
    conversionQueue = {
      name: 'conversion',
      getJobCounts: jest.fn().mockResolvedValue({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3
      })
    } as any;

    waitingGauge = { set: jest.fn() } as any;
    activeGauge = { set: jest.fn() } as any;
    completedGauge = { set: jest.fn() } as any;
    failedGauge = { set: jest.fn() } as any;

    service = new JobsMetricsService(
      conversionQueue,
      waitingGauge,
      activeGauge,
      completedGauge,
      failedGauge
    );
  });

  it('should update metrics', async () => {
    await service.updateMetrics();

    expect(conversionQueue.getJobCounts).toHaveBeenCalledWith(
      'waiting', 'active', 'completed', 'failed'
    );
    expect(waitingGauge.set).toHaveBeenCalledWith({ queue: 'conversion' }, 5);
    expect(activeGauge.set).toHaveBeenCalledWith({ queue: 'conversion' }, 2);
    expect(completedGauge.set).toHaveBeenCalledWith({ queue: 'conversion' }, 100);
    expect(failedGauge.set).toHaveBeenCalledWith({ queue: 'conversion' }, 3);
  });

  it('should handle errors gracefully', async () => {
    conversionQueue.getJobCounts = jest.fn().mockRejectedValue(new Error('Redis error'));

    await service.updateMetrics();

    // Should not throw
    expect(conversionQueue.getJobCounts).toHaveBeenCalled();
  });
});
```

---

## Troubleshooting

### Metrics Not Updating
**Symptom**: Metrics show stale values

**Solutions:**
1. Check cron schedule is running
2. Verify queue connection
3. Check Redis connection
4. Review service logs

### High Queue Backlog
**Symptom**: `bullmq_queue_jobs_waiting` keeps increasing

**Solutions:**
1. Check ConversionProcessor is running
2. Verify worker concurrency
3. Check for stuck jobs
4. Scale workers

### Zero Active Jobs
**Symptom**: `bullmq_queue_jobs_active` is always 0

**Solutions:**
1. Check ConversionProcessor is registered
2. Verify worker is running
3. Check processor logs for errors
4. Restart worker process

### High Failure Rate
**Symptom**: `bullmq_queue_jobs_failed` increasing rapidly

**Solutions:**
1. Check processor logs for errors
2. Verify YouTube download is working
3. Check Supabase upload is working
4. Review retry configuration

---

## Related Documentation

- [Module Documentation](./01-module.md) - Module configuration
- [Processor Documentation](./02-conversion-processor.md) - Job processing
- [Cleanup Documentation](./03-cleanup-service.md) - Scheduled cleanup
- [Prometheus Documentation](https://prometheus.io/docs/) - Prometheus metrics

---

**Previous**: [Cleanup Documentation](./03-cleanup-service.md)  
**Next**: [Overview](./00-overview.md)
