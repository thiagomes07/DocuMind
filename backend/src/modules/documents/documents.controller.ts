import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  Res,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from './dto/query.dto';
import {
  UploadDocumentResponseDto,
  FILE_UPLOAD_CONSTRAINTS,
} from './dto/upload.dto';
import {
  GetDocumentsResponseDto,
  DocumentDetailDto,
  DeleteDocumentResponseDto,
} from './dto/query.dto';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(private documentsService: DocumentsService) {}

  // ==================== UPLOAD ====================

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 600000 } }) // 3 uploads per 10 minutes
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload document',
    description:
      'Upload a document (PNG, JPG, PDF) for OCR processing. Max 10MB.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (PNG, JPG, PDF)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded and processing started',
    type: UploadDocumentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file (wrong type or too large)',
  })
  @ApiResponse({
    status: 403,
    description: 'Document limit reached (5 max)',
  })
  async upload(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: FILE_UPLOAD_CONSTRAINTS.MAX_SIZE,
            message: 'Arquivo deve ter no máximo 10MB',
          }),
          new FileTypeValidator({
            fileType: new RegExp(
              FILE_UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.join('|'),
            ),
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadDocumentResponseDto> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    this.logger.log(
      `📤 Upload request: ${file.originalname} (${userId})`,
    );

    const document = await this.documentsService.create(userId, file);

    return {
      success: true,
      documentId: document.id,
      filename: document.filename,
      status: document.status,
    };
  }

  // ==================== LIST DOCUMENTS ====================

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List user documents',
    description: 'Get paginated list of user documents',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    type: GetDocumentsResponseDto,
  })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<GetDocumentsResponseDto> {
    this.logger.debug(`📋 Listing documents for user: ${userId}`);

    const result = await this.documentsService.findAll(
      userId,
      query.page,
      query.limit,
    );

    return {
      documents: result.documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        uploadedAt: doc.uploadedAt,
        status: doc.status,
        thumbnailUrl: (doc as any).thumbnailUrl,
      })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  // ==================== GET DOCUMENT DETAILS ====================

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get document details',
    description: 'Get document with extracted text and LLM history',
  })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: DocumentDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  async findOne(
    @Param('id') documentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<DocumentDetailDto> {
    this.logger.debug(`📄 Getting document: ${documentId}`);

    const document = await this.documentsService.findOne(documentId, userId);

    return {
      id: document.id,
      filename: document.filename,
      originalName: document.originalName,
      uploadedAt: document.uploadedAt,
      fileUrl: document.fileUrl,
      extractedText: document.extractedText || '',
      status: document.status,
      errorMessage: document.errorMessage,
      llmInteractions: document.llmInteractions.map((interaction: any) => ({
        id: interaction.id,
        question: interaction.question,
        answer: interaction.answer,
        tokensUsed: interaction.tokensUsed,
        createdAt: interaction.createdAt,
      })),
    };
  }

  // ==================== DELETE DOCUMENT ====================

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 deletes per minute
  @ApiOperation({
    summary: 'Delete document',
    description: 'Delete document from storage and database',
  })
  @ApiResponse({
    status: 200,
    description: 'Document deleted successfully',
    type: DeleteDocumentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  async remove(
    @Param('id') documentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<DeleteDocumentResponseDto> {
    this.logger.log(`🗑️ Deleting document: ${documentId}`);

    await this.documentsService.remove(documentId, userId);

    return {
      success: true,
    };
  }

  // ==================== DOWNLOAD PDF ====================

  @Get(':id/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Download document as PDF',
    description: 'Generate PDF with extracted text and chat history',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF generated successfully',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Document not ready for download',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async download(
    @Param('id') documentId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`📥 Downloading PDF: ${documentId}`);

    const pdfBuffer = await this.documentsService.downloadPdf(
      documentId,
      userId,
    );

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `document-${timestamp}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}