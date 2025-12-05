import {
  Controller,
  Post,
  Body,
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
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LlmService } from './llm.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TokenLimitGuard } from '../../common/guards/token-limit.guard';
import { AskQuestionDto, AskQuestionResponseDto } from './dto/ask.dto';
import { UsersService } from '../users/users.service';

@ApiTags('LLM')
@ApiBearerAuth()
@Controller('llm')
export class LlmController {
  private readonly logger = new Logger(LlmController.name);

  constructor(
    private llmService: LlmService,
    private usersService: UsersService,
  ) {}

  // ==================== ASK QUESTION ====================

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TokenLimitGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 questions per minute
  @ApiOperation({
    summary: 'Ask question about document',
    description:
      'Ask a question about a document using AI. Requires document to be processed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Question answered successfully',
    type: AskQuestionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or document not ready',
  })
  @ApiResponse({
    status: 403,
    description: 'Token limit reached',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  async askQuestion(
    @CurrentUser('id') userId: string,
    @Body() dto: AskQuestionDto,
  ): Promise<AskQuestionResponseDto> {
    this.logger.log(
      `🤔 Question from user ${userId}: "${dto.question.substring(0, 50)}..."`,
    );

    const { answer, tokensUsed } = await this.llmService.askQuestion(
      userId,
      dto.documentId,
      dto.question,
    );

    // Get remaining tokens
    const tokensRemaining = await this.usersService.getRemainingTokens(userId);

    return {
      answer,
      tokensUsed,
      tokensRemaining,
    };
  }
}
