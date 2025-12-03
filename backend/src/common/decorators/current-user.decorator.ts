import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * Current User Decorator
 * Extracts authenticated user from request
 * 
 * Usage:
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * 
 * Get specific field:
 * @Get('id')
 * getUserId(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    // If no user is attached, return null
    if (!user) {
      return null;
    }

    // Return specific field if requested
    if (data) {
      return user[data];
    }

    // Return entire user object
    return user;
  },
);