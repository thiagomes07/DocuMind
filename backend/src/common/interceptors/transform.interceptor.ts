import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Standard API Response
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  timestamp?: string;
  path?: string;
}

/**
 * Transform Interceptor
 * Standardizes successful responses to { success: true, data: ... }
 * Does NOT transform responses that already have 'success' field
 * Does NOT transform file downloads (binary responses)
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        // Skip transformation for:
        // 1. Responses that already have 'success' field (already standardized)
        // 2. Binary/file responses (Buffer)
        // 3. Responses with custom structure (null or undefined data)
        if (
          data === null ||
          data === undefined ||
          Buffer.isBuffer(data) ||
          (typeof data === 'object' && 'success' in data)
        ) {
          return data;
        }

        // Skip transformation for file download endpoints
        if (path.includes('/download')) {
          return data;
        }

        // Log transformation
        this.logger.debug(`Transforming response for: ${path}`);

        // Transform response to standard format
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path,
        };
      }),
    );
  }
}