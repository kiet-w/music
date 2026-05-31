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
