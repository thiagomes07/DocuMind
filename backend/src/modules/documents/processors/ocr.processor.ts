import { Injectable, Logger } from '@nestjs/common';
import { createWorker, Worker, PSM } from 'tesseract.js';

/**
 * OCR Processor Service
 * Extracts text from images and PDFs using Tesseract.js
 */
@Injectable()
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);
  private worker: Worker | null = null;

  /**
   * Initialize Tesseract worker
   */
  private async initializeWorker(): Promise<Worker> {
    if (this.worker) {
      return this.worker;
    }

    this.logger.log('Initializing Tesseract worker...');

    const worker = await createWorker('eng+por', 1, {
      logger: (m) => {
        // Only log important messages
        if (m.status === 'recognizing text') {
          this.logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Configure OCR settings
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      tessedit_ocr_engine_mode: '1', // LSTM neural net mode
    });

    this.worker = worker;
    this.logger.log('✅ Tesseract worker initialized');

    return worker;
  }

  /**
   * Process image buffer and extract text
   */
  async processImage(imageBuffer: Buffer): Promise<string> {
    try {
      this.logger.log('Starting OCR processing for image...');

      const worker = await this.initializeWorker();

      const {
        data: { text },
      } = await worker.recognize(imageBuffer);

      // Clean extracted text
      const cleanedText = this.cleanText(text);

      this.logger.log(
        `✅ OCR completed: ${cleanedText.length} characters extracted`,
      );

      return cleanedText;
    } catch (error) {
      this.logger.error('OCR processing failed:', error);
      throw new Error(`Falha no processamento OCR: ${error.message}`);
    }
  }

  /**
   * Process multiple images and concatenate text
   */
  async processMultipleImages(imageBuffers: Buffer[]): Promise<string> {
    try {
      this.logger.log(
        `Processing ${imageBuffers.length} images with OCR...`,
      );

      const worker = await this.initializeWorker();

      const textResults: string[] = [];

      for (let i = 0; i < imageBuffers.length; i++) {
        this.logger.debug(`Processing page ${i + 1}/${imageBuffers.length}`);

        const {
          data: { text },
        } = await worker.recognize(imageBuffers[i]);

        textResults.push(text);
      }

      // Combine all pages with separators
      const combinedText = textResults
        .map((text, index) => {
          const cleaned = this.cleanText(text);
          return `--- Página ${index + 1} ---\n\n${cleaned}`;
        })
        .join('\n\n');

      this.logger.log(
        `✅ Multi-page OCR completed: ${combinedText.length} characters`,
      );

      return combinedText;
    } catch (error) {
      this.logger.error('Multi-page OCR processing failed:', error);
      throw new Error(
        `Falha no processamento OCR multi-página: ${error.message}`,
      );
    }
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
    // Check if we extracted at least some text
    const minLength = 10;
    const cleanedText = text.trim();

    if (cleanedText.length < minLength) {
      this.logger.warn(
        `Text extraction might be invalid: only ${cleanedText.length} characters`,
      );
      return false;
    }

    return true;
  }

  /**
   * Cleanup worker on module destroy
   */
  async onModuleDestroy() {
    if (this.worker) {
      this.logger.log('Terminating Tesseract worker...');
      await this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Get OCR statistics
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