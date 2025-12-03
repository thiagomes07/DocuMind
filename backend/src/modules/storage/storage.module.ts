import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Storage Module
 * Provides AWS S3 storage operations
 */
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}