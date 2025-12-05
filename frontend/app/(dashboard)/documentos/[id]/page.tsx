import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getDocumentAction, deleteDocumentAction } from '@/lib/actions/documents';
import { getAccessToken } from '@/lib/auth/token-manager';
import { DocumentViewer } from '@/components/document/document-viewer';
import { Spinner } from '@/components/ui/loading';
import { AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ id?: string }>;
}

const DEFAULT_METADATA: Metadata = {
  title: 'Documento | DocuMind',
  description: 'Visualize e analise documentos com IA',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: documentId } = await params;

  if (!documentId) {
    return DEFAULT_METADATA;
  }

  const result = await getDocumentAction(documentId);

  if (result.data) {
    return {
      title: `${result.data.filename} | DocuMind`,
      description: `Visualize e analise o documento ${result.data.filename}`,
    };
  }

  return DEFAULT_METADATA;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id: documentId } = await params;

  if (!documentId) {
    notFound();
  }
  const ensuredDocumentId = documentId as string;

  // Check authentication
  const accessToken = await getAccessToken();

  if (!accessToken) {
    redirect('/login');
  }

  // Fetch document details
  const result = await getDocumentAction(ensuredDocumentId);

  // Handle errors
  if (result.error) {
    if (result.error.code === 'DOCUMENT_NOT_FOUND') {
      notFound();
    }

    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border border-[var(--border-color)] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--error-500)]/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-[var(--error-500)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--gray-900)] mb-2">
            Erro ao carregar documento
          </h2>
          <p className="text-[var(--gray-600)] mb-6">{result.error.message}</p>
          <a
            href="/documentos"
            className="inline-flex items-center justify-center px-4 py-2 bg-[var(--primary-500)] text-white rounded-lg hover:bg-[var(--primary-600)] transition-colors"
          >
            Voltar para documentos
          </a>
        </div>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  const document = result.data;

  // Handle delete
  async function handleDelete() {
    'use server';
    await deleteDocumentAction(ensuredDocumentId);
    redirect('/documentos');
  }

  return <DocumentViewer document={document} onDelete={handleDelete} />;
}