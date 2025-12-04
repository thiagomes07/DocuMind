import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, TokenPair } from './dto/tokens.dto';
import type { User } from '@prisma/client';

type DurationString =
  | `${number}ms`
  | `${number}s`
  | `${number}m`
  | `${number}h`
  | `${number}d`
  | `${number}w`
  | `${number}y`;
type JwtExpiresIn = number | DurationString;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly pepper: string;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.pepper = this.configService.get<string>('app.passwordPepper') ?? '';
    if (!this.pepper) {
      throw new Error('PASSWORD_PEPPER environment variable is required');
    }
  }

  /**
   * Register a new user
   */
  async register(dto: RegisterDto): Promise<{ userId: string }> {
    this.logger.log(`Registration attempt: ${dto.email}`);

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Generate unique salt for this user
    const salt = this.generateSalt();

    // Hash password with salt and pepper
    const passwordHash = await this.hashPassword(dto.password, salt);

    // Create user
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      passwordSalt: salt,
    });

    this.logger.log(`✅ User registered successfully: ${user.id}`);

    return { userId: user.id };
  }

  /**
   * Login user and generate tokens
   */
  async login(
    dto: LoginDto,
  ): Promise<{ user: User; tokens: TokenPair }> {
    this.logger.log(`Login attempt: ${dto.email}`);

    // Find user by email
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(
      dto.password,
      user.passwordHash,
      user.passwordSalt,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Hash and save refresh token
    const refreshTokenHash = await this.hashRefreshToken(tokens.refreshToken);
    await this.usersService.updateRefreshToken(user.id, refreshTokenHash);

    this.logger.log(`✅ User logged in successfully: ${user.id}`);

    return { user, tokens };
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    this.logger.debug(`Refresh attempt for user: ${userId}`);

    // Get user
    const user = await this.usersService.findByIdOrThrow(userId);

    // Check if refresh token exists in DB
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Token de atualização inválido');
    }

    // Verify refresh token hash
    const isValid = await argon2.verify(
      user.refreshTokenHash,
      refreshToken,
    );

    if (!isValid) {
      // Invalid token - clear from DB
      await this.usersService.updateRefreshToken(userId, null);
      throw new UnauthorizedException('Token de atualização inválido');
    }

    // Generate new access token only
    const accessToken = await this.generateAccessToken(user);

    this.logger.debug(`✅ Access token refreshed for user: ${userId}`);

    return { accessToken };
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(userId: string): Promise<void> {
    this.logger.log(`Logout: ${userId}`);

    // Clear refresh token from database
    await this.usersService.updateRefreshToken(userId, null);

    this.logger.log(`✅ User logged out: ${userId}`);
  }

  /**
   * Validate user by ID (for JWT strategy)
   */
  async validateUser(userId: string): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return user;
  }

  // ==================== TOKEN GENERATION ====================

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Generate access token (15 minutes)
   */
  private async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };
    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    if (!accessSecret) {
      throw new Error('JWT access secret is not configured');
    }

    const accessExpiresIn: JwtExpiresIn =
      (this.configService.get<string>('jwt.accessExpiresIn') as DurationString) ??
      '15m';

    return this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });
  }

  /**
   * Generate refresh token (7 days)
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
      jti: uuidv4(), // Unique ID for this refresh token
    };
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) {
      throw new Error('JWT refresh secret is not configured');
    }

    const refreshExpiresIn: JwtExpiresIn =
      (this.configService.get<string>('jwt.refreshExpiresIn') as DurationString) ??
      '7d';

    return this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });
  }

  // ==================== PASSWORD HASHING ====================

  /**
   * Generate random salt (32 bytes)
   */
  private generateSalt(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Hash password with Argon2id + salt + pepper
   */
  private async hashPassword(
    password: string,
    salt: string,
  ): Promise<string> {
    // Combine password with pepper (global secret)
    const passwordWithPepper = password + this.pepper;

    // Hash with Argon2id
    return argon2.hash(passwordWithPepper, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
      salt: Buffer.from(salt, 'hex'),
    });
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(
    password: string,
    hash: string,
    salt: string,
  ): Promise<boolean> {
    try {
      const passwordWithPepper = password + this.pepper;
      return await argon2.verify(hash, passwordWithPepper);
    } catch (error) {
      this.logger.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Hash refresh token for storage
   */
  private async hashRefreshToken(token: string): Promise<string> {
    return argon2.hash(token, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  // ==================== COOKIE HELPERS ====================

  /**
   * Set authentication cookies in response
   */
  setAuthCookies(res: Response, tokens: TokenPair): void {
    const cookieConfig = this.configService.get('jwt.cookie');

    if (!cookieConfig) {
      throw new Error('JWT cookie configuration is missing');
    }

    // Set access token cookie
    res.cookie(
      cookieConfig.access.name,
      tokens.accessToken,
      {
        httpOnly: cookieConfig.access.httpOnly,
        secure: cookieConfig.access.secure,
        sameSite: cookieConfig.access.sameSite,
        path: cookieConfig.access.path,
        maxAge: cookieConfig.access.maxAge,
      },
    );

    // Set refresh token cookie
    res.cookie(
      cookieConfig.refresh.name,
      tokens.refreshToken,
      {
        httpOnly: cookieConfig.refresh.httpOnly,
        secure: cookieConfig.refresh.secure,
        sameSite: cookieConfig.refresh.sameSite,
        path: cookieConfig.refresh.path,
        maxAge: cookieConfig.refresh.maxAge,
      },
    );

    this.logger.debug('✅ Auth cookies set');
  }

  /**
   * Set only access token cookie (for refresh endpoint)
   */
  setAccessTokenCookie(res: Response, accessToken: string): void {
    const cookieConfig = this.configService.get('jwt.cookie');

    if (!cookieConfig) {
      throw new Error('JWT cookie configuration is missing');
    }

    res.cookie(
      cookieConfig.access.name,
      accessToken,
      {
        httpOnly: cookieConfig.access.httpOnly,
        secure: cookieConfig.access.secure,
        sameSite: cookieConfig.access.sameSite,
        path: cookieConfig.access.path,
        maxAge: cookieConfig.access.maxAge,
      },
    );

    this.logger.debug('✅ Access token cookie refreshed');
  }

  /**
   * Clear authentication cookies
   */
  clearAuthCookies(res: Response): void {
    const cookieConfig = this.configService.get('jwt.cookie');

    if (!cookieConfig) {
      throw new Error('JWT cookie configuration is missing');
    }

    // Clear access token
    res.clearCookie(cookieConfig.access.name, {
      path: cookieConfig.access.path,
    });

    // Clear refresh token
    res.clearCookie(cookieConfig.refresh.name, {
      path: cookieConfig.refresh.path,
    });

    this.logger.debug('✅ Auth cookies cleared');
  }
}