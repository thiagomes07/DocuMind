import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Prisma Exception Filter
 * Handles Prisma-specific errors (unique constraints, foreign keys, etc.)
 * Converts database errors into user-friendly HTTP responses
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Map Prisma error codes to HTTP responses
    const { status, message, error } = this.mapPrismaError(exception);

    const errorPayload = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    // Log error
    this.logger.warn(
      `Prisma Error [${exception.code}] on ${request.method} ${request.url}: ${message}`,
    );

    response.status(status).json(errorPayload);
  }

  /**
   * Map Prisma error codes to HTTP responses
   */
  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    error: string;
  } {
    switch (exception.code) {
      // Unique constraint violation (e.g., duplicate email)
      case 'P2002': {
        const field = this.extractField(exception);
        return {
          status: HttpStatus.CONFLICT,
          message: field
            ? `${this.formatFieldName(field)} já está em uso`
            : 'Registro duplicado',
          error: 'Conflict',
        };
      }

      // Foreign key constraint violation
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Referência inválida',
          error: 'Bad Request',
        };

      // Record not found
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Registro não encontrado',
          error: 'Not Found',
        };

      // Required field missing
      case 'P2000':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Valor muito longo para o campo',
          error: 'Bad Request',
        };

      // Value out of range
      case 'P2006':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Valor inválido fornecido',
          error: 'Bad Request',
        };

      // Dependent records exist (cannot delete)
      case 'P2014':
        return {
          status: HttpStatus.CONFLICT,
          message:
            'Não é possível deletar porque existem registros dependentes',
          error: 'Conflict',
        };

      // Record to update not found
      case 'P2016':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Registro para atualização não encontrado',
          error: 'Not Found',
        };

      // Query interpretation error
      case 'P2019':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Erro na interpretação da consulta',
          error: 'Bad Request',
        };

      // Default case
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro interno do banco de dados',
          error: 'Internal Server Error',
        };
    }
  }

  /**
   * Extract field name from Prisma error metadata
   */
  private extractField(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string | null {
    if (exception.meta && typeof exception.meta === 'object') {
      const meta = exception.meta as any;

      // Try to extract field from target array
      if (Array.isArray(meta.target) && meta.target.length > 0) {
        return meta.target[0];
      }

      // Try to extract field from field_name
      if (typeof meta.field_name === 'string') {
        return meta.field_name;
      }
    }

    return null;
  }

  /**
   * Format field name for user display
   */
  private formatFieldName(field: string): string {
    const fieldMap: Record<string, string> = {
      email: 'Email',
      name: 'Nome',
      username: 'Nome de usuário',
      phone: 'Telefone',
      document: 'Documento',
      cpf: 'CPF',
      cnpj: 'CNPJ',
    };

    return fieldMap[field.toLowerCase()] || field;
  }
}

/**
 * Catch all other Prisma errors (validation, connection, etc.)
 */
@Catch(Prisma.PrismaClientValidationError)
export class PrismaValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaValidationExceptionFilter.name);

  catch(exception: Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorPayload = {
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Erro de validação nos dados fornecidos',
      error: 'Bad Request',
    };

    this.logger.warn(
      `Prisma Validation Error on ${request.method} ${request.url}`,
    );

    response.status(HttpStatus.BAD_REQUEST).json(errorPayload);
  }
}