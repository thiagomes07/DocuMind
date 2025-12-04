import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * Ask Question DTO - Request to LLM about a document
 */
export class AskQuestionDto {
  @ApiProperty({
    description: 'Document ID to ask about',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'ID do documento inválido' })
  @IsNotEmpty({ message: 'ID do documento é obrigatório' })
  documentId: string;

  @ApiProperty({
    description: 'Question to ask about the document',
    example: 'Quais são os pontos principais deste documento?',
    minLength: 1,
    maxLength: 500,
  })
  @IsString({ message: 'Pergunta deve ser um texto' })
  @IsNotEmpty({ message: 'Pergunta é obrigatória' })
  @MinLength(1, { message: 'Pergunta não pode estar vazia' })
  @MaxLength(500, { message: 'Pergunta deve ter no máximo 500 caracteres' })
  question: string;
}

/**
 * Ask Question Response DTO
 */
export class AskQuestionResponseDto {
  @ApiProperty({
    description: 'LLM answer to the question',
    example: 'Os pontos principais do documento são...',
  })
  answer: string;

  @ApiProperty({
    description: 'Number of tokens used in this interaction',
    example: 150,
  })
  tokensUsed: number;

  @ApiProperty({
    description: 'Remaining tokens available',
    example: 9850,
  })
  tokensRemaining: number;
}