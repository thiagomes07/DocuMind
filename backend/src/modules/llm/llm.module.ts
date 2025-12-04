// src/modules/llm/llm.module.ts
import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { UsersModule } from '../users/users.module';

/**
 * LLM Module
 * Handles AI-powered document analysis using AWS Bedrock Claude 3
 */
@Module({
  imports: [UsersModule],
  controllers: [LlmController],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}