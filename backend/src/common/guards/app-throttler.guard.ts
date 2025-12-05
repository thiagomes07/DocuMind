import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * Custom throttler guard that always skips platform health/readiness endpoints.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const req = requestProps?.context?.switchToHttp().getRequest<Request>();
    const path = req?.route?.path || req?.url || '';

    // Bypass rate limiting for infra probes
    if (path.endsWith('/health') || path.endsWith('/ready') || path.endsWith('/live')) {
      return true;
    }

    return super.handleRequest(requestProps);
  }
}