import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard responsável por validar o refresh token via estratégia `jwt-refresh`.
 */
@Injectable()
export class RefreshAuthGuard extends AuthGuard('jwt-refresh') {}