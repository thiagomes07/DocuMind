'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { LogIn, ArrowRight } from 'lucide-react';

export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const toast = useToast();

  const handleChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const validated = loginSchema.parse(formData);
      const result = await login(validated);

      if (!result.success && result.error) {
        toast.error(result.error.message);
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0] as keyof LoginFormData;
          if (field) {
            fieldErrors[field] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleChange('email')}
          error={errors.email}
          disabled={isSubmitting}
          autoComplete="email"
          autoFocus
        />

        <Input
          label="Senha"
          type="password"
          placeholder="Digite sua senha"
          value={formData.password}
          onChange={handleChange('password')}
          error={errors.password}
          disabled={isSubmitting}
          autoComplete="current-password"
        />
      </div>

      {/* Forgot Password Link */}
      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          onClick={() => toast.info('Funcionalidade em breve')}
        >
          Esqueceu sua senha?
        </button>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isSubmitting}
        disabled={isSubmitting}
      >
        {!isSubmitting && <LogIn className="h-5 w-5" />}
        Entrar na conta
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">
            Novo no DocuMind?
          </span>
        </div>
      </div>

      {/* Register Link */}
      <Link
        href="/registro"
        className="flex items-center justify-center gap-2 w-full px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Criar uma conta grátis
        <ArrowRight className="h-4 w-4" />
      </Link>
    </form>
  );
}