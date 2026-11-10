import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 hover:bg-brand-700 active:bg-brand-800',
  secondary: 'bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50 active:bg-brand-100',
  ghost: 'text-brand-700 hover:bg-brand-100 active:bg-brand-200',
  danger: 'bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50 active:bg-red-100',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
}
