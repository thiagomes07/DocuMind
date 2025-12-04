import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

/**
 * Bootstrap Function
 * Initializes and configures the NestJS application
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    cors: false, // We'll configure CORS manually below
  });

  const configService = app.get(ConfigService);

  // ===== GLOBAL PREFIX =====
  app.setGlobalPrefix('api', {
    exclude: ['health'], // Health check endpoint without /api prefix
  });

  // ===== VERSIONING (Optional - for future API versions) =====
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ===== COOKIE PARSER =====
  app.use(cookieParser());

  // ===== CORS CONFIGURATION =====
  const corsOrigin = configService.get<string>('app.corsOrigin');
  const isDevelopment = configService.get<boolean>('app.isDevelopment');

  app.enableCors({
    origin: isDevelopment
      ? [corsOrigin, 'http://localhost:3000', 'http://localhost:3001'] // Allow multiple origins in dev
      : corsOrigin, // Single origin in production
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  logger.log(`🔗 CORS enabled for: ${corsOrigin}`);

  // ===== GLOBAL VALIDATION PIPE =====
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties from DTOs
      forbidNonWhitelisted: true, // Throw error if unknown properties exist
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert primitive types automatically
      },
      disableErrorMessages: false, // Show detailed validation errors
      stopAtFirstError: false, // Collect all validation errors
    }),
  );

  // ===== SWAGGER / OPENAPI DOCUMENTATION =====
  const swaggerConfig = new DocumentBuilder()
    .setTitle('OCR + LLM API')
    .setDescription(
      `
# Sistema de OCR com Integração LLM

API RESTful para upload de documentos (PNG, JPG, PDF), processamento OCR com Tesseract.js 
e análise inteligente com AWS Bedrock Claude 3 Haiku.

## Funcionalidades

- 🔐 **Autenticação JWT** com cookies HTTP-only
- 📄 **Upload de Documentos** (PNG, JPG, PDF até 10MB)
- 🔍 **OCR Automático** com Tesseract.js
- 🤖 **Análise com IA** via AWS Bedrock Claude 3 Haiku
- 💾 **Armazenamento** em AWS S3
- 🔒 **Rate Limiting** para proteção da API

## Limites por Usuário

- **Documentos**: 5 máximo
- **Tokens LLM**: 10.000 por conta
- **Upload**: 3 por 10 minutos
- **Requisições**: 30 por minuto (padrão)

## Autenticação

Esta API usa cookies HTTP-only para autenticação. Após o login:
1. Cookies são automaticamente enviados em requisições subsequentes
2. Access token expira em 15 minutos
3. Refresh token expira em 7 dias
4. Use \`/auth/refresh\` para renovar o access token

## Erros Padronizados

Todos os erros seguem o formato:
\`\`\`json
{
  "success": false,
  "statusCode": 400,
  "message": "Mensagem de erro",
  "error": "Bad Request"
}
\`\`\`
    `.trim(),
    )
    .setVersion('1.0.0')
    .setContact(
      'API Support',
      'https://github.com/seu-repo',
      'support@example.com',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    })
    .addTag('Authentication', 'Endpoints de autenticação e gestão de sessão')
    .addTag('Documents', 'Upload, OCR e gestão de documentos')
    .addTag('LLM', 'Análise de documentos com IA (Claude 3 Haiku)')
    .addTag('Health', 'Health checks e status do sistema')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'OCR API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 30px 0; }
      .swagger-ui .info .title { font-size: 2.5rem; }
    `,
    swaggerOptions: {
      persistAuthorization: true, // Keep auth token between page refreshes
      displayRequestDuration: true,
      docExpansion: 'none', // Collapse all sections by default
      filter: true, // Enable search filter
      showRequestHeaders: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
  });

  logger.log('📚 Swagger documentation available at /docs');

  // ===== GRACEFUL SHUTDOWN =====
  app.enableShutdownHooks();

  // ===== START SERVER =====
  const port = configService.get<number>('app.port');
  const nodeEnv = configService.get<string>('app.nodeEnv');

  await app.listen(port);

  // ===== STARTUP LOGS =====
  logger.log('');
  logger.log('='.repeat(60));
  logger.log(`🚀 Application is running!`);
  logger.log(`📍 Local:            http://localhost:${port}`);
  logger.log(`📚 Documentation:    http://localhost:${port}/docs`);
  logger.log(`🏥 Health Check:     http://localhost:${port}/health`);
  logger.log(`🌍 Environment:      ${nodeEnv}`);
  logger.log(`🔗 CORS Origin:      ${corsOrigin}`);
  logger.log(`⏱️  Rate Limit:       30 req/min (default)`);
  logger.log('='.repeat(60));
  logger.log('');

  // Log important warnings for production
  if (nodeEnv === 'production') {
    logger.warn('⚠️  Running in PRODUCTION mode');
    logger.warn('⚠️  Ensure all secrets are properly configured');
    logger.warn('⚠️  Database backups should be automated');
  } else {
    logger.log('🔧 Development mode - additional logging enabled');
  }
}

// Start the application
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Failed to start application:', error);
  process.exit(1);
});