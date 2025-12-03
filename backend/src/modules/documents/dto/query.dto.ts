import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * Pagination Query DTO
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (starts at 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser no mínimo 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 9,
    minimum: 1,
    maximum: 50,
    default: 9,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser no mínimo 1' })
  @Max(50, { message: 'Limite deve ser no máximo 50' })
  limit?: number = 9;
}

/**
 * Document List Item DTO
 */
export class DocumentListItemDto {
  @ApiProperty({
    description: 'Document ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Document filename',
    example: 'documento_2024-01-15.pdf',
  })
  filename: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  uploadedAt: Date;

  @ApiProperty({
    description: 'Processing status',
    example: 'COMPLETED',
    enum: ['PROCESSING', 'COMPLETED', 'ERROR'],
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Thumbnail URL (for images)',
    example: 'https://s3.amazonaws.com/bucket/thumbnail.jpg',
  })
  thumbnailUrl?: string;
}

/**
 * Get Documents Response DTO
 */
export class GetDocumentsResponseDto {
  @ApiProperty({
    description: 'List of documents',
    type: [DocumentListItemDto],
  })
  documents: DocumentListItemDto[];

  @ApiProperty({
    description: 'Total number of documents',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;
}

/**
 * Document Detail DTO
 */
export class DocumentDetailDto {
  @ApiProperty({
    description: 'Document ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Document filename',
    example: 'documento_2024-01-15.pdf',
  })
  filename: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'meu_documento.pdf',
  })
  originalName: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  uploadedAt: Date;

  @ApiProperty({
    description: 'File download URL (signed)',
    example: 'https://s3.amazonaws.com/bucket/file.pdf?signature=...',
  })
  fileUrl: string;

  @ApiProperty({
    description: 'Extracted text from OCR',
    example: 'Lorem ipsum dolor sit amet...',
  })
  extractedText: string;

  @ApiProperty({
    description: 'Processing status',
    example: 'COMPLETED',
    enum: ['PROCESSING', 'COMPLETED', 'ERROR'],
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Error message if processing failed',
    example: 'Falha no processamento OCR',
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'LLM interaction history',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        question: { type: 'string' },
        answer: { type: 'string' },
        tokensUsed: { type: 'number' },
        createdAt: { type: 'string' },
      },
    },
  })
  llmInteractions: any[];
}

/**
 * Delete Document Response DTO
 */
export class DeleteDocumentResponseDto {
  @ApiProperty({
    description: 'Deletion success status',
    example: true,
  })
  success: boolean;
}