'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/ui/loading';
import { FileText, LogOut, User } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingOverlay message="Carregando..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[var(--border-color)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/documentos" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary-500)] flex items-center justify-center group-hover:bg-[var(--primary-600)] transition-colors">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-[var(--gray-900)]">
                  DocuMind
                </h1>
                <p className="text-xs text-[var(--gray-500)]">
                  Sistema OCR com IA
                </p>
              </div>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-[var(--gray-50)] rounded-lg">
                  <User className="h-5 w-5 text-[var(--gray-600)]" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-[var(--gray-900)]">
                      {user.name}
                    </p>
                    <p className="text-xs text-[var(--gray-500)]">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--gray-500)]">
              © 2024 DocuMind. Todos os direitos reservados.
            </p>
            {user && (
              <div className="flex items-center gap-6 text-xs text-[var(--gray-500)]">
                <div>
                  <span className="font-medium">Documentos:</span>{' '}
                  {user.documentsCount}/{user.documentsLimit}
                </div>
                <div>
                  <span className="font-medium">Tokens:</span>{' '}
                  {user.tokensUsed.toLocaleString()}/
                  {user.tokensLimit.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}