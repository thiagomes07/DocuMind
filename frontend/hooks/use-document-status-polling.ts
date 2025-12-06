"use client";

import { useEffect, useRef, useState } from "react";
import { DocumentStatus } from "@/types/document";
import { fetchDocumentStatus } from "@/lib/actions/documents-client";

interface UseDocumentStatusPollingOptions {
  documentId: string;
  initialStatus: DocumentStatus;
  onStatusChange?: (newStatus: DocumentStatus) => void;
  enabled?: boolean;
}

/**
 * Hook for progressive polling of document processing status
 *
 * Polling strategy:
 * - Initial delay: 3s
 * - Increments: +2s per attempt
 * - Max delay: 30s
 * - Max attempts: 10 (stops after ~3 minutes)
 * - Auto-stops when status is COMPLETED or ERROR
 */
export function useDocumentStatusPolling({
  documentId,
  initialStatus,
  onStatusChange,
  enabled = true,
}: UseDocumentStatusPollingOptions) {
  const [status, setStatus] = useState<DocumentStatus>(initialStatus);
  const [isPolling, setIsPolling] = useState(false);
  const attemptRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Polling configuration
  const INITIAL_DELAY = 3000; // 3s
  const DELAY_INCREMENT = 2000; // +2s per attempt
  const MAX_DELAY = 30000; // 30s max
  const MAX_ATTEMPTS = 10; // Stop after 10 attempts (~3 min)

  const calculateDelay = (attempt: number): number => {
    const delay = INITIAL_DELAY + attempt * DELAY_INCREMENT;
    return Math.min(delay, MAX_DELAY);
  };

  const poll = async () => {
    if (!enabled || attemptRef.current >= MAX_ATTEMPTS) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    try {
      const result = await fetchDocumentStatus(documentId);

      if (result.data && result.data.status !== status) {
        const newStatus = result.data.status;
        setStatus(newStatus);
        onStatusChange?.(newStatus);

        // Stop polling if processing is complete
        if (newStatus === "COMPLETED" || newStatus === "ERROR") {
          setIsPolling(false);
          return;
        }
      }

      // Continue polling if still processing
      if (status === "PROCESSING" && result.data?.status === "PROCESSING") {
        attemptRef.current += 1;
        const delay = calculateDelay(attemptRef.current);

        timeoutRef.current = setTimeout(() => {
          poll();
        }, delay);
      } else {
        setIsPolling(false);
      }
    } catch (error) {
      console.error("Polling error:", error);
      setIsPolling(false);
    }
  };

  useEffect(() => {
    // Only poll if status is PROCESSING and polling is enabled
    if (status === "PROCESSING" && enabled) {
      // Start first poll after initial delay
      timeoutRef.current = setTimeout(() => {
        poll();
      }, INITIAL_DELAY);
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, enabled, status]); // Re-run if documentId, enabled, or status changes

  // Update internal status if initialStatus changes (e.g., from parent)
  useEffect(() => {
    if (initialStatus !== status) {
      setStatus(initialStatus);
      attemptRef.current = 0; // Reset attempts when status changes externally
    }
  }, [initialStatus]);

  return {
    status,
    isPolling,
  };
}
