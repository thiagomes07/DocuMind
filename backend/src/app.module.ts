import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { LlmModule } from './modules/llm/llm.module';
import { StorageModule } from './modules/storage/storage.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import {
  PrismaExceptionFilter,
  PrismaValidationExceptionFilter,
} from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { configModules } from './config';

/**
 * App Module - Root module of the application
 * Configures global modules, guards, filters, and interceptors
 */
@Module({
  imports: [
    // Configuration (Global)
    ConfigModule.forRoot({
      isGlobal: true,
      load: configModules,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Rate Limiting (Global)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute in milliseconds
        limit: 300, // 300 requests per minute (default) - 5 req/s
      },
      {
        name: 'upload',
        ttl: 600000, // 10 minutes
        limit: 10, // 10 uploads per 10 minutes
      },
      {
        name: 'llm',
        ttl: 60000, // 1 minute
        limit: 30, // 30 LLM requests per minute
      },
    ]),

    // Database (Global via @Global decorator in PrismaModule)
    PrismaModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    DocumentsModule,
    LlmModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // JWT authentication (can be bypassed with @Public())
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard, // Rate limiting (skips health/ready/live)
    },

    // Global Exception Filters (order matters - specific to generic)
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter, // Handle Prisma known errors
    },
    {
      provide: APP_FILTER,
      useClass: PrismaValidationExceptionFilter, // Handle Prisma validation errors
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, // Handle all HTTP exceptions
    },

    // Global Interceptors (order matters - execution order)
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor, // Log all requests (first)
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor, // Transform responses (last)
    },
  ],
})
export class AppModule {}
