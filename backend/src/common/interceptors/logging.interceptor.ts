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
    const { method, url, query, params, body } = request;
    const userId = request.user?.id?.substring(0, 8) ?? 'anon';
    const now = Date.now();

    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    const entrypoint = `${className}.${handlerName}`;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          const status = response.statusCode;
          const emoji = status >= 400 ? '⚠️' : '✅';

          this.logger.info(
            {
              method,
              url,
              query,
              params,
              body: redact(body),
              duration: `${duration}ms`,
              statusCode: status,
              userId,
              entrypoint,
            },
            `${emoji} ${method} ${url} → ${status} (${duration}ms) [${entrypoint}] user=${userId}`,
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
              userId,
              entrypoint,
            },
            `❌ ${method} ${url} → FAIL (${duration}ms) [${entrypoint}] user=${userId} | ${error.message}`,
          );
        },
      }),
    );
  }
}
