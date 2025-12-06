"use client";

import { DocumentDetail, DocumentListItem } from "@/types/document";
import { AppError } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Client-side function to fetch document status
 * Used for polling without server actions overhead
 */
export async function fetchDocumentStatus(documentId: string): Promise<{
  data?: Pick<DocumentListItem, "id" | "status">;
  error?: AppError;
}> {
  try {
    const response = await fetch(`/api/documents/${documentId}/status`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: {
          type: "business",
          message: errorData.message || "Erro ao buscar status do documento",
        },
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Fetch document status error:", error);
    return {
      error: {
        type: "network",
        message: "Erro ao conectar com o servidor",
        retry: true,
      },
    };
  }
}
