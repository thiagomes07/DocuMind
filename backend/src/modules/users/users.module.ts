import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

/**
 * Users Module
 * Handles user CRUD operations and user-related business logic
 * No controller - used internally by Auth and other modules
 */
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}