import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

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
}
