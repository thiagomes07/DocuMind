import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2
      className={cn('animate-spin text-[var(--primary-500)]', sizes[size], className)}
      aria-label="Carregando"
    />
  );
}

export interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Carregando...' }: LoadingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <Spinner size="lg" />
      <p className="text-sm text-[var(--gray-600)]">{message}</p>
    </div>
  );
}

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-[var(--gray-200)]',
        className
      )}
      aria-label="Carregando conteúdo"
    />
  );
}

export function DocumentCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-white p-4 shadow-sm">
      <Skeleton className="h-40 w-full mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  );
}

export interface DocumentListSkeletonProps {
  count?: number;
}

export function DocumentListSkeleton({ count = 9 }: DocumentListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <DocumentListSkeleton count={6} />
    </div>
  );
}

export interface DotsLoaderProps {
  size?: 'sm' | 'md' | 'lg';
}

export function DotsLoader({ size = 'md' }: DotsLoaderProps) {
  const sizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
  };

  return (
    <div className="flex items-center gap-1" aria-label="Carregando">
      <div
        className={cn(
          'rounded-full bg-[var(--primary-500)] animate-pulse',
          sizes[size]
        )}
        style={{ animationDelay: '0ms' }}
      />
      <div
        className={cn(
          'rounded-full bg-[var(--primary-500)] animate-pulse',
          sizes[size]
        )}
        style={{ animationDelay: '150ms' }}
      />
      <div
        className={cn(
          'rounded-full bg-[var(--primary-500)] animate-pulse',
          sizes[size]
        )}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}