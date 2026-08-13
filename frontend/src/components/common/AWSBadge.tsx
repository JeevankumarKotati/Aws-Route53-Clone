import React from 'react';
import { cn } from '@/lib/utils';

interface AWSBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'info' | 'warning' | 'error' | 'neutral' | 'public' | 'private';
  className?: string;
}

export function AWSBadge({ children, variant = 'neutral', className }: AWSBadgeProps) {
  const variantStyles = {
    success: 'bg-[#ebf8f2] text-[#1d8102] border-[#1d8102]/30 dark:bg-[#133820] dark:text-[#5bc87b] dark:border-[#5bc87b]/40',
    info: 'bg-[#f1faff] text-[#0073bb] border-[#0073bb]/30 dark:bg-[#123048] dark:text-[#539fe5] dark:border-[#539fe5]/40',
    warning: 'bg-[#fff8e7] text-[#8d6b00] border-[#8d6b00]/30 dark:bg-[#382b10] dark:text-[#e8b931] dark:border-[#e8b931]/40',
    error: 'bg-[#fdf3f1] text-[#d13212] border-[#d13212]/30 dark:bg-[#3a1814] dark:text-[#eb6f5e] dark:border-[#eb6f5e]/40',
    neutral: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    public: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    private: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-[3px] text-xs font-semibold border tracking-wide uppercase',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
