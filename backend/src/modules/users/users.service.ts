import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import {
  CreateUserDto,
  UpdateUserLimitsDto,
  UserDto,
  SessionDto,
} from './dto/user.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async create(data: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    this.logger.log(`Creating new user: ${data.email}`);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        passwordSalt: data.passwordSalt,
        documentsLimit: data.documentsLimit || 5,
        tokensLimit: data.tokensLimit || 10000,
      },
    });

    this.logger.log(`✅ User created: ${user.id}`);
    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by ID or throw
   */
  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  /**
   * Update user's refresh token hash
   */
  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  /**
   * Update user limits (documents count, tokens used)
   */
  async updateLimits(
    userId: string,
    data: UpdateUserLimitsDto,
  ): Promise<User> {
    this.logger.debug(`Updating limits for user ${userId}:`, data);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.documentsCount !== undefined && {
          documentsCount: data.documentsCount,
        }),
        ...(data.tokensUsed !== undefined && {
          tokensUsed: data.tokensUsed,
        }),
      },
    });
  }

  /**
   * Increment document count
   */
  async incrementDocumentCount(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        documentsCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Decrement document count
   */
  async decrementDocumentCount(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        documentsCount: {
          decrement: 1,
        },
      },
    });
  }

  /**
   * Increment tokens used
   */
  async incrementTokensUsed(userId: string, tokens: number): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        tokensUsed: {
          increment: tokens,
        },
      },
    });
  }

  /**
   * Check if user has reached document limit
   */
  async hasReachedDocumentLimit(userId: string): Promise<boolean> {
    const user = await this.findByIdOrThrow(userId);
    return user.documentsCount >= user.documentsLimit;
  }

  /**
   * Check if user has reached token limit
   */
  async hasReachedTokenLimit(userId: string): Promise<boolean> {
    const user = await this.findByIdOrThrow(userId);
    return user.tokensUsed >= user.tokensLimit;
  }

  /**
   * Get remaining documents slots
   */
  async getRemainingDocuments(userId: string): Promise<number> {
    const user = await this.findByIdOrThrow(userId);
    return Math.max(0, user.documentsLimit - user.documentsCount);
  }

  /**
   * Get remaining tokens
   */
  async getRemainingTokens(userId: string): Promise<number> {
    const user = await this.findByIdOrThrow(userId);
    return Math.max(0, user.tokensLimit - user.tokensUsed);
  }

  /**
   * Convert User to UserDto (safe representation)
   */
  toDto(user: User): UserDto {
    return plainToInstance(UserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Convert User to SessionDto (with computed fields)
   */
  toSessionDto(user: User): SessionDto {
    return plainToInstance(SessionDto, user, {
      excludeExtraneousValues: true,
    });
  }
}