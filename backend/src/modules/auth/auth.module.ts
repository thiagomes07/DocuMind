import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';

type DurationString =
  | `${number}ms`
  | `${number}s`
  | `${number}m`
  | `${number}h`
  | `${number}d`
  | `${number}w`
  | `${number}y`;
type JwtExpiresIn = number | DurationString;
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    // Users module for user operations
    UsersModule,
    ConfigModule,

    // Passport for authentication strategies
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),

    // JWT module with async configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const accessSecret = configService.get<string>('jwt.accessSecret');

        if (!accessSecret) {
          throw new Error('JWT access secret is not configured');
        }

        const accessExpiresIn: JwtExpiresIn =
          (configService.get<string>('jwt.accessExpiresIn') as DurationString) ?? '15m';

        return {
          secret: accessSecret,
          signOptions: {
            expiresIn: accessExpiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshStrategy, RefreshAuthGuard],
  exports: [AuthService], // Export for use in other modules if needed
})
export class AuthModule {}