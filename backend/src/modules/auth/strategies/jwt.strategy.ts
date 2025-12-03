import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../dto/tokens.dto';
import { User } from '@prisma/client';

/**
 * JWT Strategy - Validates access tokens from cookies
 * Used for protecting routes that require authentication
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      // Extract JWT from cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = request?.cookies?.['access_token'];
          if (!token) {
            return null;
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
      passReqToCallback: false,
    });
  }

  /**
   * Validate JWT payload and return user
   * This is called automatically by Passport after token verification
   */
  async validate(payload: JwtPayload): Promise<User> {
    // Verify token type
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token inválido');
    }

    // Get user from database
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // User will be attached to request.user
    return user;
  }
}