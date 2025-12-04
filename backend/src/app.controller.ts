import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Health Check Response
 */
interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
    storage: 'configured' | 'not configured';
    llm: 'configured' | 'not configured';
  };
}

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Basic root endpoint
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'API root' })
  @ApiResponse({
    status: 200,
    description: 'API information',
  })
  getRoot(): { message: string; version: string; docs: string } {
    return {
      message: 'OCR + LLM API',
      version: '1.0.0',
      docs: '/docs',
    };
  }

  /**
   * Health check endpoint
   * Used by Docker, Kubernetes, and load balancers
   */
  @Public()
  @Get('health')
  @Version(VERSION_NEUTRAL)
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the API and its dependencies are running properly',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-15T10:30:00.000Z',
        uptime: 3600,
        environment: 'production',
        version: '1.0.0',
        services: {
          database: 'connected',
          storage: 'configured',
          llm: 'configured',
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
  })
  async healthCheck(): Promise<HealthCheckResponse> {
    const services = {
      database: 'disconnected' as 'connected' | 'disconnected',
      storage: 'not configured' as 'configured' | 'not configured',
      llm: 'not configured' as 'configured' | 'not configured',
    };

    // Check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      services.database = 'connected';
    } catch (error) {
      services.database = 'disconnected';
    }

    // Check storage configuration
    const s3Bucket = this.config.get<string>('storage.bucket');
    if (s3Bucket) {
      services.storage = 'configured';
    }

    // Check LLM configuration
    const llmModelId = this.config.get<string>('llm.modelId');
    if (llmModelId) {
      services.llm = 'configured';
    }

    // Determine overall status
    const status = services.database === 'connected' ? 'ok' : 'error';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.config.get<string>('app.nodeEnv') ?? 'development',
      version: '1.0.0',
      services,
    };
  }

  /**
   * Readiness probe (for Kubernetes)
   * Checks if the service is ready to accept traffic
   */
  @Public()
  @Get('ready')
  @Version(VERSION_NEUTRAL)
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Check if the service is ready to accept requests',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not ready',
  })
  async readinessCheck(): Promise<{ ready: boolean }> {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      return { ready: true };
    } catch (error) {
      return { ready: false };
    }
  }

  /**
   * Liveness probe (for Kubernetes)
   * Simple check that the process is alive
   */
  @Public()
  @Get('live')
  @Version(VERSION_NEUTRAL)
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Check if the service process is alive',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
  })
  alive(): { alive: boolean } {
    return { alive: true };
  }
}