import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UsersService } from '../users/users.service';
import { OcrProcessor } from './processors/ocr.processor';
import { Document, DocumentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as PDFDocument from 'pdfkit';
import { Readable } from 'stream';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private users: UsersService,
    private ocrProcessor: OcrProcessor,
    private config: ConfigService,
  ) {}

  /**
   * Create and upload new document
   */
  async create(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Document> {
    this.logger.log(`📤 Upload started: ${file.originalname} (${userId})`);

    // Check document limit
    const hasReachedLimit = await this.users.hasReachedDocumentLimit(userId);
    if (hasReachedLimit) {
      throw new ForbiddenException(
        'Você atingiu o limite de 5 documentos. Delete um documento para fazer upload de um novo.',
      );
    }

    // Validate file
    this.validateFile(file);

    // Generate unique document ID and filename
    const documentId = uuidv4();
    const extension = this.storage.getExtensionFromMimeType(file.mimetype);
    const filename = `${documentId}.${extension}`;

    // Build S3 keys
    const s3Key = this.storage.buildDocumentKey(userId, documentId, extension);
    let thumbnailKey: string | null = null;

    try {
      // Upload file to S3
      await this.storage.uploadFile(s3Key, file.buffer, file.mimetype);

      // Generate thumbnail if image
      if (this.storage.isImage(file.mimetype)) {
        const thumbKey = this.storage.buildThumbnailKey(userId, documentId);
        thumbnailKey = await this.storage.generateThumbnail(
          file.buffer,
          thumbKey,
        );
      }

      // Create document record
      const document = await this.prisma.document.create({
        data: {
          id: documentId,
          userId,
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          s3Key,
          s3ThumbnailKey: thumbnailKey,
          status: DocumentStatus.PROCESSING,
        },
      });

      // Increment user document count
      await this.users.incrementDocumentCount(userId);

      // Start OCR processing asynchronously (fire-and-forget)
      this.processOcrAsync(documentId, userId, file.buffer, file.mimetype);

      this.logger.log(`✅ Document created: ${documentId}`);

      return document;
    } catch (error) {
      // Cleanup S3 on error
      await this.storage.deleteFile(s3Key);
      if (thumbnailKey) {
        await this.storage.deleteFile(thumbnailKey);
      }

      this.logger.error('Document creation failed:', error);
      throw error;
    }
  }

  /**
   * Find all documents with pagination
   */
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 9,
  ): Promise<{
    documents: Document[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.document.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Generate signed URLs for thumbnails
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        if (doc.s3ThumbnailKey) {
          try {
            const thumbnailUrl = await this.storage.getSignedUrl(
              doc.s3ThumbnailKey,
            );
            return { ...doc, thumbnailUrl };
          } catch (error) {
            this.logger.warn(
              `Failed to generate thumbnail URL: ${doc.id}`,
              error,
            );
          }
        }
        return doc;
      }),
    );

    return {
      documents: documentsWithUrls,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Find one document by ID
   */
  async findOne(documentId: string, userId: string): Promise<any> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        llmInteractions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    // Verify ownership
    if (document.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este documento',
      );
    }

    // Generate signed URL for file
    const fileUrl = await this.storage.getSignedUrl(document.s3Key);

    return {
      ...document,
      fileUrl,
    };
  }

  /**
   * Remove document
   */
  async remove(documentId: string, userId: string): Promise<void> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    // Verify ownership
    if (document.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar este documento',
      );
    }

    // Delete from S3
    await this.storage.deleteFile(document.s3Key);
    if (document.s3ThumbnailKey) {
      await this.storage.deleteFile(document.s3ThumbnailKey);
    }

    // Delete from database (cascade will delete LLM interactions)
    await this.prisma.document.delete({
      where: { id: documentId },
    });

    // Decrement user document count
    await this.users.decrementDocumentCount(userId);

    this.logger.log(`✅ Document deleted: ${documentId}`);
  }

  /**
   * Download document as PDF with extracted text and chat history
   */
  async downloadPdf(documentId: string, userId: string): Promise<Buffer> {
    const document = await this.findOne(documentId, userId);

    if (document.status !== DocumentStatus.COMPLETED) {
      throw new BadRequestException(
        'Documento ainda está sendo processado ou falhou',
      );
    }

    this.logger.log(`📄 Generating PDF for document: ${documentId}`);

    return this.generatePdf(document);
  }

  /**
   * Generate PDF with document data
   */
  private async generatePdf(document: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Documento OCR', { align: 'center' });

      doc.moveDown();

      // Document info
      doc.fontSize(10).font('Helvetica');
      doc.text(`Arquivo: ${document.originalName}`);
      doc.text(`Data: ${new Date(document.uploadedAt).toLocaleString('pt-BR')}`);
      doc.text(`Status: ${document.status}`);

      doc.moveDown(2);

      // Extracted text section
      doc.fontSize(14).font('Helvetica-Bold').text('Texto Extraído');
      doc.moveDown();

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(document.extractedText || 'Nenhum texto extraído', {
          align: 'justify',
        });

      // LLM Interactions section
      if (document.llmInteractions && document.llmInteractions.length > 0) {
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('Histórico de Perguntas');
        doc.moveDown();

        document.llmInteractions.forEach((interaction: any, index: number) => {
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(`Pergunta ${index + 1}:`, { continued: false });

          doc
            .fontSize(10)
            .font('Helvetica')
            .text(interaction.question, { indent: 20 });

          doc.moveDown(0.5);

          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Resposta:', { continued: false });

          doc
            .fontSize(10)
            .font('Helvetica')
            .text(interaction.answer, { indent: 20, align: 'justify' });

          doc
            .fontSize(8)
            .font('Helvetica')
            .text(`Tokens: ${interaction.tokensUsed}`, { indent: 20 });

          doc.moveDown(1.5);
        });
      }

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .text(
            `Página ${i + 1} de ${pages.count}`,
            50,
            doc.page.height - 50,
            { align: 'center' },
          );
      }

      doc.end();
    });
  }

  /**
   * Process OCR asynchronously (fire-and-forget)
   */
  private processOcrAsync(
    documentId: string,
    userId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): void {
    // Execute in background without blocking
    (async () => {
      try {
        this.logger.log(`🔍 Starting OCR for document: ${documentId}`);

        let extractedText: string;

        if (this.storage.isImage(mimeType)) {
          // Process image directly
          extractedText = await this.ocrProcessor.processImage(fileBuffer);
        } else if (this.storage.isPdf(mimeType)) {
          // For PDF, we'd need to convert to images first
          // For POC, we'll just indicate PDF text extraction is not implemented
          extractedText =
            '[PDF] Extração de texto de PDF não implementada nesta versão. Use imagens PNG ou JPG.';
        } else {
          throw new Error('Tipo de arquivo não suportado para OCR');
        }

        // Validate extraction
        if (!this.ocrProcessor.isValidExtraction(extractedText)) {
          this.logger.warn(
            `OCR extraction might be invalid for: ${documentId}`,
          );
        }

        // Update document with extracted text
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            status: DocumentStatus.COMPLETED,
            extractedText,
            ocrCompletedAt: new Date(),
          },
        });

        const stats = this.ocrProcessor.getStatistics(extractedText);
        this.logger.log(
          `✅ OCR completed for ${documentId}: ${stats.words} words, ${stats.lines} lines`,
        );
      } catch (error) {
        this.logger.error(`❌ OCR failed for ${documentId}:`, error);

        // Update document with error
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            status: DocumentStatus.ERROR,
            errorMessage: error.message || 'Erro no processamento OCR',
          },
        });
      }
    })();
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    const maxSize = this.config.get<number>('storage.maxFileSize');
    const allowedTypes = this.config.get<string[]>(
      'storage.allowedMimeTypes',
    );

    // Check file size
    if (file.size > maxSize) {
      throw new BadRequestException(
        `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo não permitido. Use PNG, JPG ou PDF',
      );
    }
  }
}