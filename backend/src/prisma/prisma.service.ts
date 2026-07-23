import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async onModuleInit() {
    this.logger.info('Connecting to Prisma database...');
    try {
      await this.$connect();
      this.logger.info('Successfully connected to database');
    } catch (error) {
      this.logger.error(
        { error: error.message },
        'Failed to connect to database',
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.info('Disconnecting from database...');
    await this.$disconnect();
    this.logger.info('Database disconnected');
  }
}
