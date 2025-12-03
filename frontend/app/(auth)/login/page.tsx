import { Metadata } from 'next';
import { LoginForm } from '@/components/forms/login-form';

export const metadata: Metadata = {
  title: 'Login | DocuMind',
  description: 'Faça login na sua conta DocuMind',
};

export default function LoginPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Bem-vindo de volta! 👋
        </h2>
        <p className="text-base text-gray-600">
          Entre com suas credenciais para acessar sua conta
        </p>
      </div>

      {/* Form */}
      <LoginForm />
    </div>
  );
}