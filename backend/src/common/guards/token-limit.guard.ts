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
 * Token Limit Guard
 * Prevents users from making LLM requests when token limit is reached
 * Apply to LLM routes: @UseGuards(TokenLimitGuard)
 */
@Injectable()
export class TokenLimitGuard implements CanActivate {
  private readonly logger = new Logger(TokenLimitGuard.name);

  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('Token limit check failed: No user in request');
      throw new ForbiddenException('Usuário não autenticado');
    }

    const userId = user.id;

    // Check if user has reached token limit
    const hasReachedLimit = await this.usersService.hasReachedTokenLimit(
      userId,
    );

    if (hasReachedLimit) {
      const maxTokens = this.configService.get<number>('app.maxTokensPerUser');

      this.logger.warn(
        `User ${userId} attempted LLM request but has reached token limit (${maxTokens})`,
      );

      throw new ForbiddenException(
        `Você atingiu o limite de ${maxTokens.toLocaleString('pt-BR')} tokens. Não é possível fazer novas perguntas.`,
      );
    }

    // Get remaining tokens for logging
    const remaining = await this.usersService.getRemainingTokens(userId);
    this.logger.debug(`User ${userId} has ${remaining} tokens remaining`);

    return true;
  }
}