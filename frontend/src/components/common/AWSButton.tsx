import React from 'react';
import { cn } from '@/lib/utils';

interface AWSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export function AWSButton({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  ...props
}: AWSButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-[2px]';

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-4 py-1.5 text-sm gap-2',
    lg: 'px-5 py-2 text-base gap-2.5'
  };

  const variantStyles = {
    // AWS Orange Primary Action Button
    primary: 'bg-[#ec7211] hover:bg-[#eb5f07] text-white border border-[#ec7211] shadow-xs active:bg-[#dd5806] focus:ring-[#ec7211]',
    // AWS Secondary Button
    secondary: 'bg-white dark:bg-[#232f3e] hover:bg-[#f2f3f3] dark:hover:bg-[#2c3b4e] text-[#16191f] dark:text-gray-100 border border-[#879596] dark:border-gray-600 active:bg-[#e9ebed] focus:ring-[#0073bb]',
    // AWS Danger / Delete Button
    danger: 'bg-[#d13212] hover:bg-[#ba270a] text-white border border-[#d13212] active:bg-[#a02008] focus:ring-[#d13212]',
    // Ghost / Icon Button
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border-none'
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
