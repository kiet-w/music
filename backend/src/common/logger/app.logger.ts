import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';
import pretty from 'pino-pretty';

const prettyTransport = pretty({
  colorize: true,
  translateTime: 'SYS:HH:MM:ss',
  ignore:
    'pid,hostname,req.remoteAddress,req.remotePort,res.headers,req.headers',
  messageFormat: '{msg}',
  hideObject: true,
});

const logger = pino(
  {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  },
  prettyTransport,
);

@Injectable()
export class AppLogger implements LoggerService {
  log(message: string, context = 'App') {
    logger.info(`[${context}] ${message}`);
  }

  error(message: string, trace?: string, context = 'App') {
    logger.error({ trace }, `❌ [${context}] ${message}`);
  }

  warn(message: string, context = 'App') {
    logger.warn(`⚠️ [${context}] ${message}`);
  }

  debug(message: string, context = 'App') {
    logger.debug(`[${context}] ${message}`);
  }

  // ==================== SECTION LOG ====================

  startSection(sectionName: string, extra: string = '') {
    logger.info('═'.repeat(90));
    logger.info(`🚀 SECTION START → ${sectionName} ${extra}`);
    logger.info('═'.repeat(90));
  }

  endSection(sectionName: string, extra: string = '') {
    logger.info(`🏁 SECTION END → ${sectionName} ${extra}`);
    logger.info('─'.repeat(90));
  }

  step(stepName: string, info?: any) {
    logger.info(`   • ${stepName}${info ? `  ${JSON.stringify(info)}` : ''}`);
  }

  subStep(stepName: string, info?: any) {
    logger.info(`     ○ ${stepName}${info ? `  ${JSON.stringify(info)}` : ''}`);
  }

  // ==================== REQUEST LOG ====================

  logRequest(req: any, res: any, responseTime?: number) {
    const status = res.statusCode || 200;
    const emoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';

    logger.info(
      {
        method: req.method,
        url: req.url,
        status,
        time: responseTime ? `${responseTime}ms` : '',
        userId: req.user?.id ? req.user.id.substring(0, 8) + '...' : 'guest',
      },
      `${emoji} ${req.method} ${req.url} → ${status} ${responseTime ? `(${responseTime}ms)` : ''}`,
    );
  }

  // ==================== ERROR WITHIN SECTION ====================

  processError(sectionName: string, error: any, step: string = 'unknown') {
    logger.error(
      {
        section: sectionName,
        step,
        error: error.message || error,
      },
      `💥 ERROR trong SECTION [${sectionName}] - ${step}`,
    );
  }
}
