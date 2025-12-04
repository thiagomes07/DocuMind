import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HTTP Exception Filter
 * Standardizes error responses across the application
 * Returns consistent JSON format for all HTTP exceptions
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract error message and details
    const errorResponse =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as any);

    // Build standardized error response
    const errorPayload = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorResponse.message || exception.message,
      error: errorResponse.error || this.getErrorName(status),
      ...(errorResponse.errors && { errors: errorResponse.errors }), // Validation errors
    };

    // Log error (except for common client errors)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception.stack,
      );
    } else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}: ${errorPayload.message}`,
      );
    }

    response.status(status).json(errorPayload);
  }

  /**
   * Get human-readable error name from status code
   */
  private getErrorName(status: number): string {
    const errorNames: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      413: 'Payload Too Large',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };

    return errorNames[status] || 'Error';
  }
}