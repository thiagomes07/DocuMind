'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentListItem } from '@/types/document';
import { DocumentCard } from './document-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { FileText, Upload } from 'lucide-react';

interface DocumentListProps {
  initialDocuments: DocumentListItem[];
  initialTotal: number;
  initialPage: number;
  totalPages: number;
}

export function DocumentList({
  initialDocuments,
  initialTotal,
  initialPage,
  totalPages,
}: DocumentListProps) {
  const [documents] = useState(initialDocuments);
  const router = useRouter();

  const handlePageChange = (page: number) => {
    router.push(`/documentos?page=${page}`);
  };

  const handleDelete = () => {
    // Refresh the page to get updated list
    router.refresh();
  };

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-16 w-16" />}
        title="Nenhum documento ainda"
        description="Faça upload do seu primeiro documento para começar a extrair texto e fazer perguntas com IA"
        action={{
          label: 'Upload Documento',
          onClick: () => {
            // Scroll to upload form
            document.getElementById('upload-form')?.scrollIntoView({
              behavior: 'smooth',
            });
          },
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={initialPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Total Count */}
      <div className="text-center text-sm text-[var(--gray-500)]">
        Mostrando {documents.length} de {initialTotal} documento
        {initialTotal !== 1 ? 's' : ''}
      </div>
    </div>
  );
}