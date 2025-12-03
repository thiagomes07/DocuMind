'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  GetDocumentsResponse,
  UploadDocumentResponse,
  DeleteDocumentResponse,
  DocumentDetail,
} from '@/types/document';
import { AppError, ErrorCode, ERROR_MESSAGES } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Fetch documents with pagination
 */
export async function fetchDocumentsAction(
  page: number = 1,
  limit: number = 9
): Promise<{
  data?: GetDocumentsResponse;
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

    const response = await fetch(
      `${API_URL}/documents?page=${page}&limit=${limit}`,
      {
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
        credentials: 'include',
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: {
          type: 'business',
          message: errorData.message || 'Erro ao buscar documentos',
        },
      };
    }

    const data: GetDocumentsResponse = await response.json();
    return { data };
  } catch (error) {
    console.error('Fetch documents error:', error);
    return {
      error: {
        type: 'network',
        message: 'Erro ao conectar com o servidor',
        retry: true,
      },
    };
  }
}

/**
 * Upload document
 */
export async function uploadDocumentAction(
  formData: FormData
): Promise<{
  data?: UploadDocumentResponse;
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

    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      // Map backend errors to friendly messages
      let errorMessage = data.message || 'Erro ao fazer upload';
      
      if (response.status === 403 && data.message?.includes('limit')) {
        errorMessage = ERROR_MESSAGES[ErrorCode.DOCUMENT_LIMIT_REACHED];
      } else if (response.status === 413) {
        errorMessage = ERROR_MESSAGES[ErrorCode.FILE_TOO_LARGE];
      } else if (response.status === 400 && data.message?.includes('type')) {
        errorMessage = ERROR_MESSAGES[ErrorCode.INVALID_FILE_TYPE];
      }

      return {
        error: {
          type: 'business',
          message: errorMessage,
        },
      };
    }

    // Revalidate documents page to show new upload
    revalidatePath('/documentos');

    return { data };
  } catch (error) {
    console.error('Upload document error:', error);
    return {
      error: {
        type: 'network',
        message: 'Erro ao conectar com o servidor',
        retry: true,
      },
    };
  }
}

/**
 * Delete document
 */
export async function deleteDocumentAction(
  documentId: string
): Promise<{
  data?: DeleteDocumentResponse;
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

    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: {
          type: 'business',
          message: errorData.message || 'Erro ao deletar documento',
        },
      };
    }

    const data: DeleteDocumentResponse = await response.json();

    // Revalidate documents page to remove deleted document
    revalidatePath('/documentos');

    return { data };
  } catch (error) {
    console.error('Delete document error:', error);
    return {
      error: {
        type: 'network',
        message: 'Erro ao conectar com o servidor',
        retry: true,
      },
    };
  }
}

/**
 * Get document details
 */
export async function getDocumentAction(
  documentId: string
): Promise<{
  data?: DocumentDetail;
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

    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 404) {
        return {
          error: {
            type: 'business',
            message: ERROR_MESSAGES[ErrorCode.DOCUMENT_NOT_FOUND],
            code: ErrorCode.DOCUMENT_NOT_FOUND,
          },
        };
      }

      return {
        error: {
          type: 'business',
          message: errorData.message || 'Erro ao buscar documento',
        },
      };
    }

    const data: DocumentDetail = await response.json();
    return { data };
  } catch (error) {
    console.error('Get document error:', error);
    return {
      error: {
        type: 'network',
        message: 'Erro ao conectar com o servidor',
        retry: true,
      },
    };
  }
}