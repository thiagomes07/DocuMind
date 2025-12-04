import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Custom Validation Pipe
 * Provides detailed validation error messages
 * Automatically transforms and validates incoming DTOs
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(ValidationPipe.name);

  async transform(value: any, { metatype }: ArgumentMetadata) {
    // Skip validation if no metatype or native type
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Transform plain object to class instance
    const object = plainToInstance(metatype, value);

    // Validate object
    const errors = await validate(object, {
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      skipMissingProperties: false,
      forbidUnknownValues: true,
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);

      this.logger.warn(
        `Validation failed: ${JSON.stringify(formattedErrors)}`,
      );

      throw new BadRequestException({
        message: 'Erro de validação',
        errors: formattedErrors,
      });
    }

    return object;
  }

  /**
   * Check if type should be validated
   */
  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  /**
   * Format validation errors into user-friendly messages
   */
  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    errors.forEach((error) => {
      const field = error.property;
      const messages: string[] = [];

      // Extract constraint messages
      if (error.constraints) {
        Object.values(error.constraints).forEach((message) => {
          messages.push(message);
        });
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatNestedErrors(error.children);
        Object.entries(nestedErrors).forEach(([nestedField, nestedMessages]) => {
          formattedErrors[`${field}.${nestedField}`] = nestedMessages;
        });
      }

      if (messages.length > 0) {
        formattedErrors[field] = messages;
      }
    });

    return formattedErrors;
  }

  /**
   * Format nested validation errors recursively
   */
  private formatNestedErrors(
    errors: ValidationError[],
  ): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    errors.forEach((error) => {
      const field = error.property;
      const messages: string[] = [];

      if (error.constraints) {
        Object.values(error.constraints).forEach((message) => {
          messages.push(message);
        });
      }

      if (messages.length > 0) {
        formattedErrors[field] = messages;
      }

      // Handle deeply nested errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatNestedErrors(error.children);
        Object.entries(nestedErrors).forEach(([nestedField, nestedMessages]) => {
          formattedErrors[`${field}.${nestedField}`] = nestedMessages;
        });
      }
    });

    return formattedErrors;
  }
}