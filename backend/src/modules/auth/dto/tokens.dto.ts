import { ApiProperty } from '@nestjs/swagger';

/**
 * JWT Payload - Token content
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  type: 'access' | 'refresh';
  jti?: string; // JWT ID (for refresh tokens)
}

/**
 * Token Pair - Access + Refresh
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh Response DTO
 */
export class RefreshResponseDto {
  @ApiProperty({
    description: 'Refresh success status',
    example: true,
  })
  success: boolean;
}

/**
 * Logout Response DTO
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout success status',
    example: true,
  })
  success: boolean;
}