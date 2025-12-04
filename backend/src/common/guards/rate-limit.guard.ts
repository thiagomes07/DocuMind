import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Rate Limit Guard
 * Simple in-memory rate limiter for POC
 * In production, use Redis for distributed rate limiting
 * 
 * NOTE: This is a basic implementation. For production, use:
 * - @nestjs/throttler with Redis storage
 * - Nginx rate limiting at reverse proxy level
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly requests = new Map<string, number[]>();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 30; // 30 requests per minute

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);

    // Get or initialize request timestamps
    const timestamps = this.requests.get(key) || [];
    const now = Date.now();

    // Remove old timestamps outside the time window
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs,
    );

    // Check if limit exceeded
    if (validTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = Math.min(...validTimestamps);
      const resetTime = new Date(oldestTimestamp + this.windowMs);
      const retryAfter = Math.ceil((resetTime.getTime() - now) / 1000);

      this.logger.warn(
        `Rate limit exceeded for ${key}: ${validTimestamps.length} requests`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Muitas requisições. Tente novamente em alguns instantes.',
          error: 'Too Many Requests',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  /**
   * Generate rate limit key based on user or IP
   */
  private getKey(request: any): string {
    // Use user ID if authenticated
    if (request.user?.id) {
      return `user:${request.user.id}`;
    }

    // Fallback to IP address
    const ip =
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown';

    return `ip:${ip}`;
  }

  /**
   * Clean up old entries from memory
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.requests.forEach((timestamps, key) => {
      const validTimestamps = timestamps.filter(
        (timestamp) => now - timestamp < this.windowMs,
      );

      if (validTimestamps.length === 0) {
        keysToDelete.push(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    });

    keysToDelete.forEach((key) => this.requests.delete(key));

    if (keysToDelete.length > 0) {
      this.logger.debug(`Cleaned up ${keysToDelete.length} rate limit entries`);
    }
  }
}