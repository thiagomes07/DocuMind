import { z } from 'zod';

/**
 * Maximum file size (10MB in bytes)
 */
export const MAX_FILE_SIZE = 10485760; // 10MB

/**
 * Allowed file types
 */
export const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];

/**
 * Upload document validation schema
 */
export const uploadDocumentSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: 'Arquivo deve ter no máximo 10MB',
    })
    .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
      message: 'Apenas PNG, JPG ou PDF são permitidos',
    }),
});

export type UploadDocumentFormData = z.infer<typeof uploadDocumentSchema>;

/**
 * Ask LLM question validation schema
 */
export const askQuestionSchema = z.object({
  documentId: z
    .string()
    .min(1, 'ID do documento é obrigatório')
    .uuid('ID do documento inválido'),
  question: z
    .string()
    .min(1, 'Pergunta é obrigatória')
    .max(500, 'Pergunta deve ter no máximo 500 caracteres')
    .trim(),
});

export type AskQuestionFormData = z.infer<typeof askQuestionSchema>;

/**
 * Pagination validation schema
 */
export const paginationSchema = z.object({
  page: z
    .number()
    .int()
    .min(1, 'Página deve ser no mínimo 1')
    .default(1),
  limit: z
    .number()
    .int()
    .min(1, 'Limite deve ser no mínimo 1')
    .max(50, 'Limite deve ser no máximo 50')
    .default(9),
});

export type PaginationData = z.infer<typeof paginationSchema>;

/**
 * Validate file before upload
 */
export function validateFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'Arquivo deve ter no máximo 10MB',
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Apenas PNG, JPG ou PDF são permitidos',
    };
  }

  return { isValid: true };
}