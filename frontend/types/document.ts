/**
 * Document status
 */
export type DocumentStatus = "PROCESSING" | "COMPLETED" | "ERROR";

/**
 * Document list item (summary view)
 */
export interface DocumentListItem {
  id: string;
  filename: string;
  originalName: string;
  uploadedAt: string;
  status: DocumentStatus;
  thumbnailUrl?: string;
}

/**
 * LLM interaction record
 */
export interface LLMInteraction {
  id: string;
  question: string;
  answer: string;
  tokensUsed: number;
  createdAt: string;
}

/**
 * Full document details
 */
export interface DocumentDetail {
  id: string;
  filename: string;
  originalName: string;
  uploadedAt: string;
  fileUrl: string;
  extractedText: string;
  status: DocumentStatus;
  errorMessage?: string;
  llmInteractions: LLMInteraction[];
}

/**
 * Get documents response (paginated)
 */
export interface GetDocumentsResponse {
  documents: DocumentListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Upload document response
 */
export interface UploadDocumentResponse {
  success: boolean;
  documentId?: string;
  error?: string;
}

/**
 * Delete document response
 */
export interface DeleteDocumentResponse {
  success: boolean;
}

/**
 * Ask LLM question request
 */
export interface AskQuestionRequest {
  documentId: string;
  question: string;
}

/**
 * Ask LLM question response
 */
export interface AskQuestionResponse {
  answer: string;
  tokensUsed: number;
  tokensRemaining: number;
}
