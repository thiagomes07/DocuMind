import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
  Block,
} from '@aws-sdk/client-textract';

/**
 * AWS Textract Processor Service
 * Extracts text from PDF documents using AWS Textract (Asynchronous API)
 */
@Injectable()
export class TextractProcessor {
  private readonly logger = new Logger(TextractProcessor.name);
  private readonly client: TextractClient;
  private readonly bucket: string;

  constructor(private config: ConfigService) {
    // Initialize Textract client with same credentials as Bedrock/S3
    this.client = new TextractClient({
      region: this.config.get<string>('llm.region') || 'us-east-1',
      credentials: {
        accessKeyId: this.config.get<string>('llm.accessKeyId') || '',
        secretAccessKey: this.config.get<string>('llm.secretAccessKey') || '',
      },
    });

    this.bucket = this.config.get<string>('storage.bucket') || '';

    this.logger.log('✅ AWS Textract client initialized (Asynchronous API)');
  }

  /**
   * Process PDF from S3 and extract text using AWS Textract Asynchronous API
   * @param s3Key - S3 key of the PDF file
   */
  async processPdf(s3Key: string): Promise<string> {
    try {
      this.logger.log(`Starting Textract async OCR for: ${s3Key}`);

      // Start Textract job
      const startCommand = new StartDocumentTextDetectionCommand({
        DocumentLocation: {
          S3Object: {
            Bucket: this.bucket,
            Name: s3Key,
          },
        },
      });

      const startResponse = await this.client.send(startCommand);
      const jobId = startResponse.JobId;

      if (!jobId) {
        throw new Error('Failed to start Textract job - no JobId returned');
      }

      this.logger.log(`Textract job started: ${jobId}`);

      // Poll for job completion
      const extractedText = await this.pollForCompletion(jobId);

      this.logger.log(
        `✅ Textract OCR completed: ${extractedText.length} characters extracted`,
      );

      return extractedText;
    } catch (error) {
      this.logger.error('Textract OCR processing failed:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.name === 'InvalidParameterException') {
          throw new Error('Formato de PDF inválido ou corrompido');
        }

        if (error.name === 'InvalidS3ObjectException') {
          throw new Error(
            'Arquivo não encontrado no S3 ou sem permissão de acesso',
          );
        }

        if (error.name === 'UnsupportedDocumentException') {
          throw new Error(
            'Formato de documento não suportado. Use PDF, PNG ou JPG',
          );
        }

        if (error.name === 'ProvisionedThroughputExceededException') {
          throw new Error(
            'Limite de requisições do Textract excedido. Tente novamente em alguns segundos',
          );
        }

        throw new Error(
          `Falha no processamento OCR com Textract: ${error.message}`,
        );
      }

      throw new Error('Falha no processamento OCR com Textract');
    }
  }

  /**
   * Poll for Textract job completion and retrieve results
   */
  private async pollForCompletion(jobId: string): Promise<string> {
    const maxAttempts = 60; // Max 2 minutes (60 * 2 seconds)
    const pollInterval = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Wait before checking (except first attempt)
      if (attempt > 1) {
        await this.sleep(pollInterval);
      }

      const getCommand = new GetDocumentTextDetectionCommand({ JobId: jobId });
      const response = await this.client.send(getCommand);

      const status = response.JobStatus;

      this.logger.debug(
        `Textract job ${jobId} status: ${status} (attempt ${attempt}/${maxAttempts})`,
      );

      if (status === 'SUCCEEDED') {
        // Job completed successfully
        let blocks: Block[] = response.Blocks || [];

        // Handle pagination if there are more results
        let nextToken = response.NextToken;
        while (nextToken) {
          const nextCommand = new GetDocumentTextDetectionCommand({
            JobId: jobId,
            NextToken: nextToken,
          });
          const nextResponse = await this.client.send(nextCommand);
          blocks = blocks.concat(nextResponse.Blocks || []);
          nextToken = nextResponse.NextToken;
        }

        // Extract and clean text
        const extractedText = this.extractTextFromBlocks(blocks);
        return this.cleanText(extractedText);
      }

      if (status === 'FAILED') {
        const statusMessage = response.StatusMessage || 'Unknown error';
        throw new Error(`Textract job failed: ${statusMessage}`);
      }

      if (status === 'PARTIAL_SUCCESS') {
        this.logger.warn(
          `Textract job completed with partial success: ${response.StatusMessage}`,
        );
        const blocks: Block[] = response.Blocks || [];
        const extractedText = this.extractTextFromBlocks(blocks);
        return this.cleanText(extractedText);
      }

      // Status is IN_PROGRESS, continue polling
    }

    throw new Error(
      `Textract job timeout após ${(maxAttempts * pollInterval) / 1000} segundos`,
    );
  }

  /**
   * Sleep helper for polling
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extract text from Textract blocks maintaining reading order
   */
  private extractTextFromBlocks(blocks: Block[]): string {
    const lines: string[] = [];
    const lineBlocks = blocks.filter((block) => block.BlockType === 'LINE');

    // Sort blocks by vertical position (top to bottom)
    lineBlocks.sort((a, b) => {
      const topA = a.Geometry?.BoundingBox?.Top || 0;
      const topB = b.Geometry?.BoundingBox?.Top || 0;
      return topA - topB;
    });

    // Extract text from each line
    for (const block of lineBlocks) {
      if (block.Text) {
        lines.push(block.Text);
      }
    }

    return lines.join('\n');
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    if (!text) return '';

    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove leading/trailing whitespace from each line
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n')
        // Normalize line breaks
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  }

  /**
   * Validate if text extraction was successful
   */
  isValidExtraction(text: string): boolean {
    const minLength = 10;
    const cleanedText = text.trim();

    if (cleanedText.length < minLength) {
      this.logger.warn(
        `Textract extraction might be invalid: only ${cleanedText.length} characters`,
      );
      return false;
    }

    return true;
  }

  /**
   * Get extraction statistics
   */
  getStatistics(text: string): {
    characters: number;
    words: number;
    lines: number;
  } {
    const characters = text.length;
    const words = text.split(/\s+/).filter((word) => word.length > 0).length;
    const lines = text.split('\n').length;

    return { characters, words, lines };
  }
}
