import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserDto } from '../../users/dto/user.dto';

/**
 * Login DTO - User login request
 */
export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'usuario@exemplo.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SenhaForte123',
    minLength: 8,
  })
  @IsString({ message: 'Senha deve ser um texto' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  password: string;
}

/**
 * Login Response DTO
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Login success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Authenticated user data',
    type: UserDto,
  })
  user: UserDto;
}