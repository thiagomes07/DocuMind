import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { fetchDocumentsAction } from '@/lib/actions/documents';
import { getSessionAction } from '@/lib/actions/auth';
import { DocumentList } from '@/components/document/document-list';
import { UploadForm } from '@/components/forms/upload-form';
import { Upload, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Meus Documentos | DocuMind',
  description: 'Gerencie seus documentos e extraia texto com IA',
};

interface PageProps {
  searchParams: { page?: string };
}

export default async function DocumentosPage({ searchParams }: PageProps) {
  // Check authentication
  const session = await getSessionAction();
  
  if (!session) {
    redirect('/login');
  }

  // Get pagination params
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 9;

  // Fetch documents
  const result = await fetchDocumentsAction(page, limit);

  if (result.error) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--gray-900)]">
              Meus Documentos
            </h1>
            <p className="text-[var(--gray-600)] mt-1">
              Erro ao carregar documentos
            </p>
          </div>
        </div>
        
        <div className="bg-[var(--error-500)]/10 border border-[var(--error-500)]/20 rounded-lg p-6 text-center">
          <p className="text-[var(--error-600)]">{result.error.message}</p>
        </div>
      </div>
    );
  }

  const { documents = [], total = 0, totalPages = 1 } = result.data || {};

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--gray-900)]">
            Meus Documentos
          </h1>
          <p className="text-[var(--gray-600)] mt-1">
            Gerencie e analise seus documentos com IA
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--primary-500)]/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-[var(--primary-500)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--gray-900)]">
              Upload de Documento
            </h2>
            <p className="text-sm text-[var(--gray-600)]">
              Envie PNG, JPG ou PDF para extração de texto
            </p>
          </div>
        </div>
        <UploadForm />
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[var(--primary-500)]/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-[var(--primary-500)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--gray-900)]">
              Seus Documentos
            </h2>
            <p className="text-sm text-[var(--gray-600)]">
              {total} documento{total !== 1 ? 's' : ''} no total
            </p>
          </div>
        </div>

        <DocumentList
          initialDocuments={documents}
          initialTotal={total}
          initialPage={page}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}