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
import { UserPlus, CheckCircle2, XCircle } from 'lucide-react';
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

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    if (!formData.password) return null;
    return getPasswordStrength(formData.password);
  }, [formData.password]);

  // Password requirements
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
      const validated = registerSchema.parse(formData);

      // Call register action
      const result = await register(validated);

      if (!result.success && result.error) {
        toast.error(result.error.message);
      }
      // Success toast is handled by AuthContext
    } catch (error: any) {
      if (error.name === 'ZodError') {
        // Map Zod errors to form fields
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

  const strengthColors = {
    weak: 'bg-[var(--error-500)]',
    medium: 'bg-[var(--warning-500)]',
    strong: 'bg-[var(--success-500)]',
  };

  const strengthLabels = {
    weak: 'Fraca',
    medium: 'Média',
    strong: 'Forte',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
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
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange('password')}
            error={errors.password}
            disabled={isSubmitting}
            autoComplete="new-password"
          />

          {/* Password Strength Indicator */}
          {formData.password && passwordStrength && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[var(--gray-200)] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      strengthColors[passwordStrength.strength]
                    )}
                    style={{
                      width: `${(passwordStrength.score / 6) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-[var(--gray-600)]">
                  {strengthLabels[passwordStrength.strength]}
                </span>
              </div>

              {/* Requirements */}
              <div className="space-y-1">
                <RequirementItem
                  met={requirements.minLength}
                  text="Mínimo 8 caracteres"
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
          placeholder="••••••••"
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
        <UserPlus className="h-5 w-5" />
        Criar conta
      </Button>

      <p className="text-center text-sm text-[var(--gray-600)]">
        Já tem uma conta?{' '}
        <Link
          href="/login"
          className="font-medium text-[var(--primary-500)] hover:text-[var(--primary-600)] transition-colors focus:outline-none focus:underline"
        >
          Fazer login
        </Link>
      </p>
    </form>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs transition-colors',
        met ? 'text-[var(--success-600)]' : 'text-[var(--gray-500)]'
      )}
    >
      {met ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      <span>{text}</span>
    </div>
  );
}