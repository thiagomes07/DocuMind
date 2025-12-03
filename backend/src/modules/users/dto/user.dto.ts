import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * User DTO - Safe user representation without sensitive data
 */
@Exclude()
export class UserDto {
  @Expose()
  @ApiProperty({
    description: 'Unique user identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'User email address',
    example: 'usuario@exemplo.com',
  })
  email: string;

  @Expose()
  @ApiProperty({
    description: 'User full name',
    example: 'João Silva',
  })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'Number of documents uploaded',
    example: 3,
  })
  documentsCount: number;

  @Expose()
  @ApiProperty({
    description: 'Maximum documents allowed',
    example: 5,
  })
  documentsLimit: number;

  @Expose()
  @ApiProperty({
    description: 'Total tokens consumed',
    example: 1500,
  })
  tokensUsed: number;

  @Expose()
  @ApiProperty({
    description: 'Maximum tokens allowed',
    example: 10000,
  })
  tokensLimit: number;

  @Expose()
  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}

/**
 * Session DTO - Extended user info for authenticated sessions
 */
@Exclude()
export class SessionDto extends UserDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Remaining document slots',
    example: 2,
  })
  get documentsRemaining(): number {
    return this.documentsLimit - this.documentsCount;
  }

  @Expose()
  @ApiPropertyOptional({
    description: 'Remaining tokens',
    example: 8500,
  })
  get tokensRemaining(): number {
    return this.tokensLimit - this.tokensUsed;
  }

  @Expose()
  @ApiPropertyOptional({
    description: 'Has reached document limit',
    example: false,
  })
  get hasReachedDocumentLimit(): boolean {
    return this.documentsCount >= this.documentsLimit;
  }

  @Expose()
  @ApiPropertyOptional({
    description: 'Has reached token limit',
    example: false,
  })
  get hasReachedTokenLimit(): boolean {
    return this.tokensUsed >= this.tokensLimit;
  }
}

/**
 * Create User DTO - Internal use for user creation
 */
export class CreateUserDto {
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  documentsLimit?: number;
  tokensLimit?: number;
}

/**
 * Update User Limits DTO
 */
export class UpdateUserLimitsDto {
  documentsCount?: number;
  tokensUsed?: number;
}