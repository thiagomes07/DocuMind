import { Metadata } from 'next';
import { RegisterForm } from '@/components/forms/register-form';

export const metadata: Metadata = {
  title: 'Criar Conta | DocuMind',
  description: 'Crie sua conta no DocuMind',
};

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Criar sua conta ✨
        </h2>
        <p className="text-base text-gray-600">
          Comece a usar o DocuMind gratuitamente hoje
        </p>
      </div>

      {/* Form */}
      <RegisterForm />
    </div>
  );
}