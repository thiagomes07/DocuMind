import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/contexts/toast-context';
import { AuthProvider } from '@/contexts/auth-context';
import { getAccessToken } from '@/lib/auth/token-manager';

export const metadata: Metadata = {
  title: 'DocuMind | Sistema OCR com IA',
  description: 'Extraia texto de documentos e faça perguntas com IA',
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const accessToken = await getAccessToken();
  const initialUser = accessToken ? undefined : null;

  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>
          <AuthProvider initialUser={initialUser}>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}