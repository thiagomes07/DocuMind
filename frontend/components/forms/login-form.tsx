'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { LogIn } from 'lucide-react';

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
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate with Zod
      const validated = loginSchema.parse(formData);

      // Call login action
      const result = await login(validated);

      if (!result.success && result.error) {
        toast.error(result.error.message);
      }
      // Success toast is handled by AuthContext
    } catch (error: any) {
      if (error.name === 'ZodError') {
        // Map Zod errors to form fields
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
      <div className="space-y-4">
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
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange('password')}
          error={errors.password}
          disabled={isSubmitting}
          autoComplete="current-password"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isSubmitting}
        disabled={isSubmitting}
      >
        <LogIn className="h-5 w-5" />
        Entrar
      </Button>

      <p className="text-center text-sm text-[var(--gray-600)]">
        Não tem uma conta?{' '}
        <Link
          href="/registro"
          className="font-medium text-[var(--primary-500)] hover:text-[var(--primary-600)] transition-colors focus:outline-none focus:underline"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}