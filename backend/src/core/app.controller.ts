import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiTags('health')
  @ApiOperation({ summary: 'Health check endpoint for liveness probe' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  healthCheck() {
    return this.appService.getHealthStatus();
  }

  @Get('health/ready')
  @ApiTags('health')
  @ApiOperation({ summary: 'Readiness check endpoint - verifies DB connectivity' })
  @ApiResponse({ status: 200, description: 'Application is ready to serve traffic' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  async readinessCheck() {
    return this.appService.getReadinessStatus();
  }
}
