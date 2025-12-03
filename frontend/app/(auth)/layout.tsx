import { ReactNode } from 'react';
import { FileText } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--primary-500)] mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">
            DocuMind
          </h1>
          <p className="text-sm text-[var(--gray-600)]">
            Sistema OCR com Inteligência Artificial
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-xl shadow-lg border border-[var(--border-color)] p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-[var(--gray-500)]">
            © 2024 DocuMind. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}