import { ApiProperty } from '@nestjs/swagger';

/**
 * Upload Document Response DTO
 */
export class UploadDocumentResponseDto {
  @ApiProperty({
    description: 'Upload success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Created document ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  documentId: string;

  @ApiProperty({
    description: 'Document filename',
    example: 'documento_2024-01-15.pdf',
  })
  filename: string;

  @ApiProperty({
    description: 'Processing status',
    example: 'PROCESSING',
    enum: ['PROCESSING', 'COMPLETED', 'ERROR'],
  })
  status: string;
}

/**
 * File upload constraints
 */
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['png', 'jpg', 'jpeg', 'pdf'],
};