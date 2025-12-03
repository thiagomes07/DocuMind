'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-[var(--success-500)]',
    textColor: 'text-white',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-[var(--error-500)]',
    textColor: 'text-white',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-[var(--warning-500)]',
    textColor: 'text-white',
  },
  info: {
    icon: Info,
    bgColor: 'bg-[var(--info-500)]',
    textColor: 'text-white',
  },
};

export function Toast({
  id,
  type,
  message,
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-lg p-4 shadow-lg max-w-md w-full',
        config.bgColor,
        config.textColor,
        isLeaving ? 'animate-slide-out' : 'animate-slide-in'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />

      <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>

      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded hover:bg-black/10 p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: Array<ToastProps>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      aria-label="Notificações"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}