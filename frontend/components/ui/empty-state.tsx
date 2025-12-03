import { ReactNode } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-lg border-2 border-dashed border-[var(--gray-300)] bg-[var(--gray-50)]',
        className
      )}
    >
      <div className="mb-4 text-[var(--gray-400)]">{icon}</div>

      <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">
        {title}
      </h3>

      <p className="text-sm text-[var(--gray-600)] max-w-md mb-6">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
}