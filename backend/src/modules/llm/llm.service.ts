// src/modules/llm/llm.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly bedrockClient: BedrockRuntimeClient;
  private readonly modelId: string;
  private readonly systemPrompt: string;

  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private config: ConfigService,
  ) {
    // Initialize Bedrock client
    this.bedrockClient = new BedrockRuntimeClient({
      region: this.config.get<string>('llm.region'),
      credentials: {
        accessKeyId: this.config.get<string>('llm.accessKeyId'),
        secretAccessKey: this.config.get<string>('llm.secretAccessKey'),
      },
    });

    this.modelId = this.config.get<string>('llm.modelId');
    this.systemPrompt = this.config.get<string>('llm.systemPrompt');

    this.logger.log(`✅ Bedrock LLM initialized: ${this.modelId}`);
  }

  /**
   * Ask question about a document
   */
  async askQuestion(
    userId: string,
    documentId: string,
    question: string,
  ): Promise<{ answer: string; tokensUsed: number }> {
    this.logger.log(`🤖 LLM request: ${documentId} by ${userId}`);

    // Validate document
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    if (document.userId !== userId) {
      throw new BadRequestException(
        'Você não tem permissão para acessar este documento',
      );
    }

    if (document.status !== DocumentStatus.COMPLETED) {
      throw new BadRequestException(
        'Documento ainda está sendo processado ou falhou',
      );
    }

    if (!document.extractedText) {
      throw new BadRequestException(
        'Nenhum texto foi extraído deste documento',
      );
    }

    // Check token limit
    const hasReachedLimit = await this.users.hasReachedTokenLimit(userId);
    if (hasReachedLimit) {
      throw new BadRequestException('Limite de tokens atingido');
    }

    // Build prompt
    const prompt = this.buildPrompt(document.extractedText, question);

    // Call Bedrock
    const { answer, tokensUsed } = await this.invokeBedrock(prompt);

    // Save interaction
    await this.prisma.llmInteraction.create({
      data: {
        documentId,
        userId,
        question,
        answer,
        tokensUsed,
      },
    });

    // Update user token usage
    await this.users.incrementTokensUsed(userId, tokensUsed);

    this.logger.log(`✅ LLM response generated: ${tokensUsed} tokens`);

    return { answer, tokensUsed };
  }

  /**
   * Build prompt for Claude
   */
  private buildPrompt(documentText: string, question: string): string {
    return `Você é um assistente de análise de documentos. Responda à pergunta do usuário com base APENAS no texto extraído do documento fornecido.

DOCUMENTO:
${documentText}

PERGUNTA DO USUÁRIO:
${question}

INSTRUÇÕES:
- Responda em português de forma clara e objetiva
- Base sua resposta APENAS no conteúdo do documento
- Se a informação não estiver no documento, diga claramente que não encontrou
- Não invente informações

RESPOSTA:`;
  }

  /**
   * Invoke AWS Bedrock Claude
   */
  private async invokeBedrock(
    prompt: string,
  ): Promise<{ answer: string; tokensUsed: number }> {
    try {
      const maxTokens = this.config.get<number>('llm.parameters.maxTokens');
      const temperature = this.config.get<number>('llm.parameters.temperature');

      // Prepare request for Claude 3
      const request = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(request),
      });

      this.logger.debug('Calling Bedrock API...');

      const response = await this.bedrockClient.send(command);

      // Parse response
      const responseBody = JSON.parse(
        new TextDecoder().decode(response.body),
      );

      const answer = responseBody.content[0].text;
      const tokensUsed =
        responseBody.usage.input_tokens + responseBody.usage.output_tokens;

      this.logger.debug(`Bedrock response: ${tokensUsed} tokens used`);

      return { answer, tokensUsed };
    } catch (error) {
      this.logger.error('Bedrock API error:', error);
      throw new BadRequestException(
        'Erro ao processar pergunta com IA. Tente novamente.',
      );
    }
  }
}