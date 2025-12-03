'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { Button } from '@/components/ui/button';
import { uploadDocumentAction } from '@/lib/actions/documents';
import { validateFile } from '@/lib/validations/document';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

const MAX_DOCUMENTS = parseInt(process.env.NEXT_PUBLIC_MAX_DOCUMENTS || '5');

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user, refreshSession } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const isLimitReached = user && user.documentsCount >= MAX_DOCUMENTS;

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLimitReached && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isLimitReached || isUploading) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelection(droppedFile);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    // Validate file
    const validation = validateFile(selectedFile);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Arquivo inválido');
      return;
    }

    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (since we don't have real progress from server)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadDocumentAction(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success('Documento enviado com sucesso! Processando...');
        
        // Refresh session to update document count
        await refreshSession();
        
        // Clear form
        handleRemoveFile();
        
        // Redirect to documents page
        setTimeout(() => {
          router.refresh();
        }, 500);
      }
    } catch (error) {
      toast.error('Erro ao fazer upload do documento');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.pdf')) {
      return <FileText className="h-8 w-8 text-[var(--error-500)]" />;
    }
    return <ImageIcon className="h-8 w-8 text-[var(--primary-500)]" />;
  };

  return (
    <div id="upload-form" className="space-y-4">
      {/* Limit Warning */}
      {isLimitReached && (
        <div className="bg-[var(--warning-500)]/10 border border-[var(--warning-500)]/20 rounded-lg p-4">
          <p className="text-sm text-[var(--warning-600)] font-medium">
            ⚠️ Limite de documentos atingido ({MAX_DOCUMENTS}/{MAX_DOCUMENTS})
          </p>
          <p className="text-xs text-[var(--gray-600)] mt-1">
            Delete um documento existente para fazer upload de um novo.
          </p>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLimitReached && !isUploading && fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragging && !isLimitReached
            ? 'border-[var(--primary-500)] bg-[var(--primary-500)]/5'
            : 'border-[var(--gray-300)] hover:border-[var(--primary-500)] hover:bg-[var(--gray-50)]',
          isLimitReached && 'opacity-50 cursor-not-allowed',
          isUploading && 'pointer-events-none'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleFileInput}
          disabled={isLimitReached || isUploading}
          className="hidden"
        />

        {!file ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[var(--primary-500)]/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-[var(--primary-500)]" />
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-[var(--gray-900)] mb-1">
                {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste um arquivo'}
              </p>
              <p className="text-sm text-[var(--gray-500)]">
                PNG, JPG ou PDF (máx. 10MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Preview */}
            <div className="flex items-center justify-between p-4 bg-[var(--gray-50)] rounded-lg">
              <div className="flex items-center gap-3">
                {getFileIcon(file.name)}
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--gray-900)] truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-[var(--gray-500)]">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              {!isUploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="p-2 hover:bg-[var(--gray-200)] rounded-lg transition-colors"
                  aria-label="Remover arquivo"
                >
                  <X className="h-4 w-4 text-[var(--gray-600)]" />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="h-2 bg-[var(--gray-200)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary-500)] transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-[var(--gray-600)]">
                  {uploadProgress < 100 ? `Enviando... ${uploadProgress}%` : 'Processando...'}
                </p>
              </div>
            )}

            {/* Upload Button */}
            {!isUploading && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                variant="primary"
                fullWidth
              >
                <Upload className="h-4 w-4" />
                Fazer Upload
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Document Count */}
      {user && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--gray-600)]">Documentos</span>
          <span
            className={cn(
              'font-medium',
              isLimitReached ? 'text-[var(--error-500)]' : 'text-[var(--gray-900)]'
            )}
          >
            {user.documentsCount} / {MAX_DOCUMENTS}
          </span>
        </div>
      )}
    </div>
  );
}