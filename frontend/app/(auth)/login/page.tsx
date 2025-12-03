import { Metadata } from 'next';
import { LoginForm } from '@/components/forms/login-form';

export const metadata: Metadata = {
  title: 'Login | DocuMind',
  description: 'Faça login na sua conta DocuMind',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--gray-900)] mb-2">
          Bem-vindo de volta
        </h2>
        <p className="text-sm text-[var(--gray-600)]">
          Entre com suas credenciais para continuar
        </p>
      </div>

      {/* Form */}
      <LoginForm />
    </div>
  );
}