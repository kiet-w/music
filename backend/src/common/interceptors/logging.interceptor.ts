/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

function redact(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(redact);
  }
  const redacted: any = {};
  const sensitiveKeys = [
    'password',
    'driveToken',
    'accessToken',
    'googleAccessToken',
    'googleRefreshToken',
    'token',
  ];
  for (const key of Object.keys(obj)) {
    if (sensitiveKeys.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redact(obj[key]);
    }
  }
  return redacted;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger('HTTP')
    private readonly logger: PinoLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, query, body, params } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          this.logger.info(
            {
              method,
              url,
              query,
              params,
              body: redact(body),
              duration: `${duration}ms`,
              statusCode: response.statusCode,
            },
            'Request completed',
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            {
              method,
              url,
              query,
              params,
              body: redact(body),
              duration: `${duration}ms`,
              error: error.message,
              stack: error.stack,
            },
            'Request failed',
          );
        },
      }),
    );
  }
}
