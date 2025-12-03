'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  registerSchema,
  RegisterFormData,
  getPasswordStrength,
} from '@/lib/validations/auth';
import { UserPlus, Check, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const toast = useToast();

  const passwordStrength = useMemo(() => {
    if (!formData.password) return null;
    return getPasswordStrength(formData.password);
  }, [formData.password]);

  const requirements = useMemo(() => {
    const pwd = formData.password;
    return {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
    };
  }, [formData.password]);

  const handleChange = (field: keyof RegisterFormData) => (
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
      const validated = registerSchema.parse(formData);
      const result = await register(validated);

      if (!result.success && result.error) {
        toast.error(result.error.message);
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0] as keyof RegisterFormData;
          if (field) {
            fieldErrors[field] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const strengthConfig = {
    weak: {
      color: 'bg-red-500',
      text: 'Fraca',
      textColor: 'text-red-600',
    },
    medium: {
      color: 'bg-yellow-500',
      text: 'Média',
      textColor: 'text-yellow-600',
    },
    strong: {
      color: 'bg-green-500',
      text: 'Forte',
      textColor: 'text-green-600',
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <Input
          label="Nome completo"
          type="text"
          placeholder="João Silva"
          value={formData.name}
          onChange={handleChange('name')}
          error={errors.name}
          disabled={isSubmitting}
          autoComplete="name"
          autoFocus
        />

        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleChange('email')}
          error={errors.email}
          disabled={isSubmitting}
          autoComplete="email"
        />

        <div>
          <Input
            label="Senha"
            type="password"
            placeholder="Crie uma senha forte"
            value={formData.password}
            onChange={handleChange('password')}
            error={errors.password}
            disabled={isSubmitting}
            autoComplete="new-password"
          />

          {formData.password && passwordStrength && (
            <div className="mt-3 space-y-3">
              {/* Strength Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    Força da senha
                  </span>
                  <span className={cn(
                    'text-xs font-semibold',
                    strengthConfig[passwordStrength.strength].textColor
                  )}>
                    {strengthConfig[passwordStrength.strength].text}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300 rounded-full',
                      strengthConfig[passwordStrength.strength].color
                    )}
                    style={{
                      width: `${(passwordStrength.score / 6) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Sua senha deve conter:
                </p>
                <RequirementItem
                  met={requirements.minLength}
                  text="Mínimo de 8 caracteres"
                />
                <RequirementItem
                  met={requirements.hasUppercase}
                  text="Uma letra maiúscula"
                />
                <RequirementItem
                  met={requirements.hasNumber}
                  text="Um número"
                />
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirmar senha"
          type="password"
          placeholder="Digite a senha novamente"
          value={formData.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={errors.confirmPassword}
          disabled={isSubmitting}
          autoComplete="new-password"
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
        {!isSubmitting && <UserPlus className="h-5 w-5" />}
        Criar minha conta
      </Button>

      {/* Terms */}
      <p className="text-xs text-center text-gray-500">
        Ao criar uma conta, você concorda com nossos{' '}
        <button
          type="button"
          className="text-blue-600 hover:text-blue-700 underline"
          onClick={() => toast.info('Funcionalidade em breve')}
        >
          Termos de Uso
        </button>{' '}
        e{' '}
        <button
          type="button"
          className="text-blue-600 hover:text-blue-700 underline"
          onClick={() => toast.info('Funcionalidade em breve')}
        >
          Política de Privacidade
        </button>
      </p>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm mt-5">
          <span className="px-4 bg-white text-gray-500">
            Já tem uma conta?
          </span>
        </div>
      </div>

      {/* Login Link */}
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 w-full px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para login
      </Link>
    </form>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs transition-colors',
        met ? 'text-green-700' : 'text-gray-500'
      )}
    >
      <div className={cn(
        'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
        met ? 'bg-green-100' : 'bg-gray-100'
      )}>
        {met && <Check className="h-3 w-3 text-green-600" />}
      </div>
      <span className={met ? 'font-medium' : ''}>{text}</span>
    </div>
  );
}