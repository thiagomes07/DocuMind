'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DocumentListItem } from '@/types/document';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast-context';
import { deleteDocumentAction } from '@/lib/actions/documents';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Eye,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
  document: DocumentListItem;
  onDelete?: () => void;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const toast = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteDocumentAction(document.id);

      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success('Documento deletado com sucesso!');
        onDelete?.();
      }
    } catch (error) {
      toast.error('Erro ao deletar documento');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const statusConfig = {
    PROCESSING: {
      icon: Clock,
      label: 'Processando',
      color: 'text-[var(--warning-500)]',
      bg: 'bg-[var(--warning-500)]/10',
    },
    COMPLETED: {
      icon: CheckCircle2,
      label: 'Concluído',
      color: 'text-[var(--success-500)]',
      bg: 'bg-[var(--success-500)]/10',
    },
    ERROR: {
      icon: AlertCircle,
      label: 'Erro',
      color: 'text-[var(--error-500)]',
      bg: 'bg-[var(--error-500)]/10',
    },
  };

  const status = statusConfig[document.status];
  const StatusIcon = status.icon;

  return (
    <div className="group relative rounded-xl border border-[var(--border-color)] bg-white shadow-sm hover:shadow-md transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] rounded-t-xl overflow-hidden bg-[var(--gray-100)]">
        {document.thumbnailUrl ? (
          <img
            src={document.thumbnailUrl}
            alt={document.filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {document.filename.toLowerCase().endsWith('.pdf') ? (
              <FileText className="h-16 w-16 text-[var(--gray-400)]" />
            ) : (
              <ImageIcon className="h-16 w-16 text-[var(--gray-400)]" />
            )}
          </div>
        )}

        {/* Status Badge */}
        <div
          className={cn(
            'absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            status.bg,
            status.color
          )}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          <span>{status.label}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3
            className="font-medium text-[var(--gray-900)] truncate"
            title={document.filename}
          >
            {document.filename}
          </h3>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            {formatDate(document.uploadedAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/documentos/${document.id}`}
            className="flex-1"
            aria-disabled={document.status === 'PROCESSING'}
            onClick={(e) => {
              if (document.status === 'PROCESSING') {
                e.preventDefault();
                toast.info('Aguarde o processamento do documento');
              }
            }}
          >
            <Button
              variant="primary"
              size="sm"
              fullWidth
              disabled={document.status === 'PROCESSING'}
            >
              <Eye className="h-4 w-4" />
              Ver
            </Button>
          </Link>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            aria-label="Deletar documento"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">
              Confirmar exclusão
            </h3>
            <p className="text-sm text-[var(--gray-600)] mb-6">
              Tem certeza que deseja deletar este documento? Esta ação não pode
              ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={isDeleting}
              >
                Deletar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}