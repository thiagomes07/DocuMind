import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import {
  RefreshResponseDto,
  LogoutResponseDto,
} from './dto/tokens.dto';
import { SessionDto } from '../users/dto/user.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  // ==================== REGISTER ====================

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 600000 } }) // 5 requests per 10 minutes
  @ApiOperation({
    summary: 'Register new user',
    description: 'Create a new user account with email and password',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    this.logger.log(`📝 Registration attempt: ${registerDto.email}`);

    const { userId } = await this.authService.register(registerDto);

    return {
      success: true,
      userId,
    };
  }

  // ==================== LOGIN ====================

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 600000 } }) // 5 requests per 10 minutes
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user and set JWT cookies',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    this.logger.log(`🔐 Login attempt: ${loginDto.email}`);

    const { user, tokens } = await this.authService.login(loginDto);

    // Set authentication cookies
    this.authService.setAuthCookies(res, tokens);

    // Return user data (without sensitive info)
    const userDto = this.usersService.toDto(user);

    return {
      success: true,
      user: userDto,
    };
  }

  // ==================== REFRESH TOKEN ====================

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiCookieAuth('refresh_token')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get new access token using refresh token from cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Access token successfully refreshed',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(
    @CurrentUser() payload: { userId: string; refreshToken: string },
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    this.logger.debug(`🔄 Token refresh: ${payload.userId}`);

    const { accessToken } = await this.authService.refresh(
      payload.userId,
      payload.refreshToken,
    );

    // Set new access token cookie
    this.authService.setAccessTokenCookie(res, accessToken);

    return {
      success: true,
    };
  }

  // ==================== LOGOUT ====================

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidate refresh token and clear cookies',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
    type: LogoutResponseDto,
  })
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    this.logger.log(`👋 Logout: ${userId}`);

    // Invalidate refresh token in database
    await this.authService.logout(userId);

    // Clear authentication cookies
    this.authService.clearAuthCookies(res);

    return {
      success: true,
    };
  }

  // ==================== SESSION INFO ====================

  @Get('session')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get session information',
    description: 'Get current authenticated user data with limits',
  })
  @ApiResponse({
    status: 200,
    description: 'Session data retrieved successfully',
    type: SessionDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async getSession(@CurrentUser() user: User): Promise<SessionDto> {
    this.logger.debug(`📊 Session info: ${user.id}`);

    // Return session data with computed fields
    return this.usersService.toSessionDto(user);
  }
}