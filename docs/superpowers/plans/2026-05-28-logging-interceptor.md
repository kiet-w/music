# Logging Interceptor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a global logging interceptor in the NestJS backend to log request methods, URLs, and processing times.

**Architecture:** A NestJS Interceptor that wraps the request handler, records the start time, and logs the details after the handler completes.

**Tech Stack:** NestJS, RxJS

---

### Task 1: Create Logging Interceptor

**Files:**
- Create: `backend/src/common/interceptors/logging.interceptor.ts`

- [ ] **Step 1: Create the interceptor file with implementation**

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(
            `${method} ${url} ${Date.now() - now}ms`,
          ),
        ),
      );
  }
}
```

- [ ] **Step 2: Commit the interceptor**

```bash
rtk proxy git add backend/src/common/interceptors/logging.interceptor.ts
rtk proxy git commit -m "feat: add logging interceptor"
```

### Task 2: Register Interceptor Globally

**Files:**
- Modify: `backend/src/main.ts`

- [ ] **Step 1: Update main.ts to use the global interceptor**

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
```

- [ ] **Step 2: Verify the application starts correctly**

Run: `cd backend && npm run build`
Expected: Successful build without errors.

- [ ] **Step 3: Commit the changes**

```bash
rtk proxy git add backend/src/main.ts
rtk proxy git commit -m "feat: register global logging interceptor"
```
