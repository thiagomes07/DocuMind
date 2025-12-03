import { Metadata } from 'next';
import { RegisterForm } from '@/components/forms/register-form';

export const metadata: Metadata = {
  title: 'Criar Conta | DocuMind',
  description: 'Crie sua conta no DocuMind',
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--gray-900)] mb-2">
          Criar uma conta
        </h2>
        <p className="text-sm text-[var(--gray-600)]">
          Comece a usar o DocuMind gratuitamente
        </p>
      </div>

      {/* Form */}
      <RegisterForm />
    </div>
  );
}