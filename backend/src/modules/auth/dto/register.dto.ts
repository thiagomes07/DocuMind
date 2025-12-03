import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Register DTO - User registration request
 */
export class RegisterDto {
  @ApiProperty({
    description: 'User full name',
    example: 'João Silva',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'Nome deve ser um texto' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, {
    message: 'Nome deve conter apenas letras',
  })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'usuario@exemplo.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @MaxLength(255, { message: 'Email muito longo' })
  email: string;

  @ApiProperty({
    description:
      'Strong password (min 8 chars, 1 uppercase, 1 number)',
    example: 'SenhaForte123',
    minLength: 8,
  })
  @IsString({ message: 'Senha deve ser um texto' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128, { message: 'Senha muito longa' })
  @Matches(/[A-Z]/, {
    message: 'Senha deve conter pelo menos uma letra maiúscula',
  })
  @Matches(/[0-9]/, {
    message: 'Senha deve conter pelo menos um número',
  })
  password: string;
}

/**
 * Register Response DTO
 */
export class RegisterResponseDto {
  @ApiProperty({
    description: 'Registration success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Created user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;
}