import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    private readonly histogram: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    
    // Ensure we only track HTTP requests
    if (!req || !res || !req.route) {
      return next.handle();
    }

    const { method, route } = req;
    const endTimer = this.histogram.startTimer({
      method,
      route: route.path,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          endTimer({ status_code: res.statusCode });
        },
        error: (err) => {
          endTimer({ status_code: err.status || 500 });
        },
      }),
    );
  }
}
