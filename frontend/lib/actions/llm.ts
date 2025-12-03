'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { AskQuestionRequest, AskQuestionResponse } from '@/types/document';
import { AppError, ErrorCode, ERROR_MESSAGES } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Ask a question about a document using LLM
 */
export async function askQuestionAction(
  documentId: string,
  question: string
): Promise<{
  data?: AskQuestionResponse;
  error?: AppError;
}> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return {
        error: {
          type: 'business',
          message: ERROR_MESSAGES[ErrorCode.UNAUTHORIZED],
          code: ErrorCode.UNAUTHORIZED,
        },
      };
    }

    const payload: AskQuestionRequest = {
      documentId,
      question: question.trim(),
    };

    const response = await fetch(`${API_URL}/llm/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${accessToken}`,
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      // Map backend errors to friendly messages
      let errorMessage = data.message || 'Erro ao processar pergunta';

      if (response.status === 403 && data.message?.includes('token')) {
        errorMessage = ERROR_MESSAGES[ErrorCode.TOKEN_LIMIT_REACHED];
      } else if (response.status === 400 && data.message?.includes('processing')) {
        errorMessage = ERROR_MESSAGES[ErrorCode.DOCUMENT_PROCESSING];
      } else if (response.status === 404) {
        errorMessage = ERROR_MESSAGES[ErrorCode.DOCUMENT_NOT_FOUND];
      }

      return {
        error: {
          type: 'business',
          message: errorMessage,
        },
      };
    }

    // Revalidate document page to update interaction history
    revalidatePath(`/documentos/${documentId}`);

    return { data };
  } catch (error) {
    console.error('Ask question error:', error);
    return {
      error: {
        type: 'network',
        message: 'Erro ao conectar com o servidor',
        retry: true,
      },
    };
  }
}