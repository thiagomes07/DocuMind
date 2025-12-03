/**
 * Error types for application error handling
 */
export type ErrorType = 'network' | 'validation' | 'business' | 'server';

/**
 * Structured application error
 */
export interface AppError {
  type: ErrorType;
  message: string;
  field?: string;
  code?: string;
  retry?: boolean;
}

/**
 * Business error codes
 */
export enum ErrorCode {
  DOCUMENT_LIMIT_REACHED = 'DOCUMENT_LIMIT_REACHED',
  TOKEN_LIMIT_REACHED = 'TOKEN_LIMIT_REACHED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  DOCUMENT_PROCESSING = 'DOCUMENT_PROCESSING',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * Error messages map for user display
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.DOCUMENT_LIMIT_REACHED]: 'Você atingiu o limite de 5 documentos',
  [ErrorCode.TOKEN_LIMIT_REACHED]: 'Limite de tokens atingido',
  [ErrorCode.INVALID_FILE_TYPE]: 'Apenas PNG, JPG ou PDF são permitidos',
  [ErrorCode.FILE_TOO_LARGE]: 'Arquivo deve ter no máximo 10MB',
  [ErrorCode.DOCUMENT_NOT_FOUND]: 'Documento não encontrado',
  [ErrorCode.DOCUMENT_PROCESSING]: 'Documento ainda está sendo processado',
  [ErrorCode.UNAUTHORIZED]: 'Você precisa fazer login',
  [ErrorCode.FORBIDDEN]: 'Você não tem permissão para acessar este recurso',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Muitas requisições. Tente novamente em alguns instantes',
};

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Fetch options with credentials
 */
export interface FetchOptions extends RequestInit {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
}