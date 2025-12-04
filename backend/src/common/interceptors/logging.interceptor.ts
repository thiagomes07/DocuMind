import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logging Interceptor
 * Logs all incoming requests and their execution time
 * Useful for debugging and monitoring API performance
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(`→ ${method} ${url} - ${ip}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const duration = Date.now() - startTime;
          const statusEmoji = this.getStatusEmoji(statusCode);

          // Log response
          this.logger.log(
            `${statusEmoji} ${method} ${url} - ${statusCode} - ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log error
          this.logger.error(
            `❌ ${method} ${url} - ${statusCode} - ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }

  /**
   * Get emoji based on HTTP status code
   */
  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '✅';
    if (statusCode >= 300 && statusCode < 400) return '↪️';
    if (statusCode >= 400 && statusCode < 500) return '⚠️';
    if (statusCode >= 500) return '❌';
    return '📨';
  }
}