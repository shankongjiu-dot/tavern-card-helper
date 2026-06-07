/** Reusable Button component with variants and polished interactions */
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: [
    'bg-gradient-to-b from-indigo-500 to-indigo-600',
    'hover:from-indigo-400 hover:to-indigo-500',
    'text-white shadow-md shadow-indigo-500/20',
    'hover:shadow-lg hover:shadow-indigo-500/30',
    'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
  ].join(' '),
  secondary: [
    'bg-slate-700/80 hover:bg-slate-600/80',
    'text-slate-100 border border-slate-600/50',
    'hover:border-slate-500/50',
    'focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
  ].join(' '),
  danger: [
    'bg-gradient-to-b from-red-500 to-red-600',
    'hover:from-red-400 hover:to-red-500',
    'text-white shadow-md shadow-red-500/20',
    'hover:shadow-lg hover:shadow-red-500/30',
    'focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
  ].join(' '),
  ghost: [
    'bg-transparent hover:bg-white/5',
    'text-slate-300 hover:text-white',
    'focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
  ].join(' '),
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-200 ease-out
        ${variantClasses[variant]} ${sizeClasses[size]}
        ${disabled ? 'opacity-40 cursor-not-allowed saturate-50' : 'cursor-pointer active:scale-[0.97]'}
        ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
