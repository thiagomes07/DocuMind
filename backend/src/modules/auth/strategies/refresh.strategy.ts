import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/strategy';
import { Request } from 'express';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../dto/tokens.dto';

/**
 * Refresh Token Strategy - Validates refresh tokens from cookies
 * Used exclusively for the /auth/refresh endpoint
 */
@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      // Extract JWT from cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request?.cookies?.['refresh_token'];
          if (!token) {
            return null;
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
      passReqToCallback: true, // Pass request to validate method
    });
  }

  /**
   * Validate refresh token payload
   * Request is passed to access the original token for verification
   */
  async validate(req: Request, payload: JwtPayload): Promise<{
    userId: string;
    refreshToken: string;
  }> {
    // Verify token type
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token inválido');
    }

    // Extract refresh token from cookie
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Token de atualização não encontrado');
    }

    // Verify user exists
    await this.authService.validateUser(payload.sub);

    // Return user ID and token for service validation
    return {
      userId: payload.sub,
      refreshToken,
    };
  }
}