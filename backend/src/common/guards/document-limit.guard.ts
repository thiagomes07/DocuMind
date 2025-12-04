import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../modules/users/users.service';

/**
 * Document Limit Guard
 * Prevents users from uploading more than the allowed number of documents
 * Apply to upload routes: @UseGuards(DocumentLimitGuard)
 */
@Injectable()
export class DocumentLimitGuard implements CanActivate {
  private readonly logger = new Logger(DocumentLimitGuard.name);

  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('Document limit check failed: No user in request');
      throw new ForbiddenException('Usuário não autenticado');
    }

    const userId = user.id;

    // Check if user has reached document limit
    const hasReachedLimit = await this.usersService.hasReachedDocumentLimit(
      userId,
    );

    if (hasReachedLimit) {
      const maxDocuments = this.configService.get<number>(
        'app.maxDocumentsPerUser',
      );

      this.logger.warn(
        `User ${userId} attempted upload but has reached document limit (${maxDocuments})`,
      );

      throw new ForbiddenException(
        `Você atingiu o limite de ${maxDocuments} documentos. Delete um documento para fazer upload de um novo.`,
      );
    }

    // Get remaining documents for logging
    const remaining = await this.usersService.getRemainingDocuments(userId);
    this.logger.debug(
      `User ${userId} has ${remaining} document slots remaining`,
    );

    return true;
  }
}