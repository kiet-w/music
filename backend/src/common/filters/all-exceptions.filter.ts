import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const request = ctx.getRequest();
    const path = httpAdapter.getRequestUrl(request);

    let message = 'Internal server error';
    let code = 'ERR_INTERNAL_SERVER';

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      message =
        typeof response === 'object' &&
        response !== null &&
        'message' in response
          ? (response as any).message
          : exception.message;

      // Map common status codes to custom error codes
      if (httpStatus === HttpStatus.CONFLICT) code = 'ERR_CONFLICT';
      if (httpStatus === HttpStatus.NOT_FOUND) code = 'ERR_NOT_FOUND';
      if (httpStatus === HttpStatus.BAD_REQUEST) code = 'ERR_BAD_REQUEST';
      if (httpStatus === HttpStatus.UNAUTHORIZED) code = 'ERR_UNAUTHORIZED';
      if (httpStatus === HttpStatus.FORBIDDEN) code = 'ERR_FORBIDDEN';
    } else if (exception instanceof Error) {
      // Handle Prisma errors not caught by Repo
      if (exception.constructor.name === 'PrismaClientKnownRequestError') {
        const prismaError = exception as any;
        if (prismaError.code === 'P2002') {
          httpStatus = HttpStatus.CONFLICT;
          code = 'ERR_CONFLICT';
          message = 'Resource already exists';
        } else if (prismaError.code === 'P2025') {
          httpStatus = HttpStatus.NOT_FOUND;
          code = 'ERR_NOT_FOUND';
          message = 'Resource not found';
        } else {
          // Don't leak internal error details for 5xx errors
          message = process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : exception.message;
        }
      } else {
        // Don't leak internal error details for 5xx errors
        message = process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception.message;
      }
    }

    const responseBody = {
      statusCode: httpStatus,
      message,
      code,
      timestamp: new Date().toISOString(),
      path,
    };

    // Logging strategy
    if (httpStatus >= 500) {
      this.logger.error(
        {
          err: exception instanceof Error ? exception : undefined,
          path,
          statusCode: httpStatus,
        },
        `Unhandled Exception: ${message}`,
      );
    } else {
      this.logger.warn(
        { path, statusCode: httpStatus },
        `HTTP Exception: ${message}`,
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
