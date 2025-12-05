import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { OcrProcessor } from './processors/ocr.processor';
import { TextractProcessor } from './processors/textract.processor';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';

/**
 * Documents Module
 * Handles document upload, storage, OCR processing, and retrieval
 */
@Module({
  imports: [
    StorageModule, // AWS S3 operations
    UsersModule,   // User operations and limits
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    OcrProcessor,
    TextractProcessor,
  ],
  exports: [DocumentsService], // Export for LLM module
})
export class DocumentsModule {}