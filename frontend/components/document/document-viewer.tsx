'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentDetail } from '@/types/document';
import { useToast } from '@/contexts/toast-context';
import { useAuth } from '@/contexts/auth-context';
import { askQuestionAction } from '@/lib/actions/llm';
import { Button } from '@/components/ui/button';
import { Spinner, DotsLoader } from '@/components/ui/loading';
import { cn, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Copy,
  CheckCheck,
  Send,
  Trash2,
  Download,
  AlertCircle,
  MessageSquare,
  FileText,
  Sparkles,
  Eye,
  X,
} from 'lucide-react';

interface DocumentViewerProps {
  document: DocumentDetail;
  onDelete?: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  tokensUsed?: number;
  timestamp: Date;
}

export function DocumentViewer({ document, onDelete }: DocumentViewerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const toast = useToast();
  const { user, refreshSession } = useAuth();

  // Load existing interactions on mount
  useEffect(() => {
    if (document.llmInteractions && document.llmInteractions.length > 0) {
      const loadedMessages: ChatMessage[] = [];
      document.llmInteractions.forEach((interaction) => {
        loadedMessages.push({
          id: `${interaction.id}-q`,
          type: 'user',
          content: interaction.question,
          timestamp: new Date(interaction.createdAt),
        });
        loadedMessages.push({
          id: `${interaction.id}-a`,
          type: 'assistant',
          content: interaction.answer,
          tokensUsed: interaction.tokensUsed,
          timestamp: new Date(interaction.createdAt),
        });
      });
      setMessages(loadedMessages);
    }
  }, [document.llmInteractions]);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(document.extractedText);
      setCopiedText(true);
      toast.success('Texto copiado!');
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      toast.error('Erro ao copiar texto');
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    const isReady = document.status === 'COMPLETED';
    if (!isReady) {
      toast.error('Documento ainda está sendo processado');
      return;
    }

    try {
      setIsDownloading(true);

      const response = await fetch(`/api/documents/${document.id}/download`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        let message = 'Erro ao baixar PDF';
        try {
          const payload = await response.json();
          message = payload?.message || message;
        } catch {
          // ignore JSON parse issues
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      const defaultName =
        document.filename?.replace(/\.[^/.]+$/, '') || 'documento';
      const disposition = response.headers.get('content-disposition');
      let filename = `${defaultName}-ocr.pdf`;

      if (disposition) {
        const match = /filename="?([^";]+)"?/i.exec(disposition);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      anchor.href = url;
      anchor.download = filename;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao baixar PDF';
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!inputValue.trim() || isAsking) return;

    const question = inputValue.trim();
    setInputValue('');
    setIsAsking(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await askQuestionAction(document.id, question);

      if (result.error) {
        toast.error(result.error.message);
        // Remove user message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } else if (result.data) {
        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: result.data.answer,
          tokensUsed: result.data.tokensUsed,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Refresh session to update token count
        await refreshSession();
      }
    } catch (error) {
      console.error('Ask question error:', error);
      toast.error('Erro ao processar pergunta');
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  // Token usage calculation
  const tokensUsed = user?.tokensUsed || 0;
  const tokensLimit = user?.tokensLimit || 10000;
  const tokensPercentage = (tokensUsed / tokensLimit) * 100;
  const tokensColor =
    tokensPercentage >= 90
      ? 'text-[var(--error-500)]'
      : tokensPercentage >= 70
      ? 'text-[var(--warning-500)]'
      : 'text-[var(--success-500)]';

  const isTokenLimitReached = tokensUsed >= tokensLimit;
  const canDownload = document.status === 'COMPLETED';
  const isImageDocument = /\.(png|jpe?g|webp|gif)$/i.test(
    (document.originalName || document.filename).toLowerCase(),
  );
  const canViewOriginalImage = isImageDocument && Boolean(document.fileUrl);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border-color)] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/documentos')}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-[var(--gray-900)] truncate">
                {document.filename}
              </h1>
              <p className="text-sm text-[var(--gray-500)]">
                {formatDate(document.uploadedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleDownload()}
              disabled={!canDownload}
              isLoading={isDownloading}
              title={!canDownload ? 'Disponível após conclusão do OCR' : undefined}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            {canViewOriginalImage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageViewer(true)}
                title="Ver imagem original"
              >
                <Eye className="h-4 w-4" />
                Ver imagem
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid lg:grid-cols-2 gap-6 p-6">
          {/* Left Panel - Extracted Text */}
          <div className="flex flex-col bg-white rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--primary-500)]" />
                <h2 className="font-semibold text-[var(--gray-900)]">
                  Texto Extraído
                </h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyText}
                disabled={!document.extractedText}
              >
                {copiedText ? (
                  <CheckCheck className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedText ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {document.extractedText ? (
                <pre className="text-sm text-[var(--gray-700)] whitespace-pre-wrap font-sans leading-relaxed">
                  {document.extractedText}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Spinner size="lg" />
                  <p className="mt-4 text-[var(--gray-600)]">
                    Processando OCR...
                  </p>
                  <p className="text-sm text-[var(--gray-500)] mt-2">
                    Isso pode levar alguns instantes
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - LLM Chat */}
          <div className="flex flex-col bg-white rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--primary-500)]" />
                <h2 className="font-semibold text-[var(--gray-900)]">
                  Assistente IA
                </h2>
              </div>
              <div className={cn('text-sm font-medium', tokensColor)}>
                {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()} tokens
              </div>
            </div>

            {/* Token Warning Banner */}
            {isTokenLimitReached && (
              <div className="bg-[var(--error-500)]/10 border-b border-[var(--error-500)]/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-[var(--error-500)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--error-600)]">
                      Limite de tokens atingido
                    </p>
                    <p className="text-xs text-[var(--gray-600)] mt-1">
                      Você atingiu o limite de {tokensLimit.toLocaleString()} tokens. Não é possível fazer novas perguntas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--primary-500)]/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-[var(--primary-500)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">
                    Faça uma pergunta
                  </h3>
                  <p className="text-sm text-[var(--gray-600)] max-w-sm mb-4">
                    Use a IA para extrair insights, resumir conteúdo ou fazer perguntas sobre o documento.
                  </p>
                  <div className="space-y-2 w-full max-w-sm">
                    <button
                      onClick={() => setInputValue('Resuma os pontos principais do texto')}
                      className="w-full text-left px-4 py-2 rounded-lg border border-[var(--gray-300)] hover:bg-[var(--gray-50)] transition-colors text-sm text-[var(--gray-700)]"
                      disabled={!document.extractedText || isTokenLimitReached}
                    >
                      💡 Resuma os pontos principais
                    </button>
                    <button
                      onClick={() => setInputValue('Quais são as informações mais importantes?')}
                      className="w-full text-left px-4 py-2 rounded-lg border border-[var(--gray-300)] hover:bg-[var(--gray-50)] transition-colors text-sm text-[var(--gray-700)]"
                      disabled={!document.extractedText || isTokenLimitReached}
                    >
                      🎯 Informações mais importantes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.type === 'user' ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg p-3',
                          message.type === 'user'
                            ? 'bg-[var(--primary-500)] text-white'
                            : 'bg-[var(--gray-100)] text-[var(--gray-900)]',
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.tokensUsed && (
                          <p className="text-xs opacity-70 mt-1">{message.tokensUsed} tokens</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isAsking && (
                    <div className="flex gap-3 justify-start">
                      <div className="bg-[var(--gray-100)] rounded-lg p-3">
                        <DotsLoader size="md" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-[var(--border-color)] p-4">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    !document.extractedText
                      ? 'Aguarde o processamento do OCR...'
                      : isTokenLimitReached
                      ? 'Limite de tokens atingido'
                      : 'Digite sua pergunta... (Enter para enviar)'
                  }
                  disabled={!document.extractedText || isAsking || isTokenLimitReached}
                  className="flex-1 resize-none rounded-lg border border-[var(--gray-300)] px-4 py-2 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent disabled:bg-[var(--gray-50)] disabled:cursor-not-allowed min-h-[44px] max-h-[120px]"
                  rows={1}
                />
                <Button
                  variant="primary"
                  onClick={handleAskQuestion}
                  disabled={
                    !inputValue.trim() ||
                    isAsking ||
                    !document.extractedText ||
                    isTokenLimitReached
                  }
                  className="self-end"
                >
                  {isAsking ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-[var(--gray-500)] mt-2">Shift + Enter para nova linha</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && document.fileUrl && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageViewer(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
              <div>
                <p className="text-sm text-[var(--gray-500)]">Imagem original</p>
                <h4 className="text-lg font-semibold text-[var(--gray-900)] truncate">
                  {document.originalName || document.filename}
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageViewer(false)}
                aria-label="Fechar visualização"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto bg-[var(--gray-50)] flex items-center justify-center p-4">
              <img
                src={document.fileUrl}
                alt={document.originalName || document.filename}
                className="max-h-full max-w-full rounded-lg shadow-lg object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">
              Confirmar exclusão
            </h3>
            <p className="text-sm text-[var(--gray-600)] mb-6">
              Tem certeza que deseja deletar este documento? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  setShowDeleteModal(false);
                  onDelete?.();
                }}
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
