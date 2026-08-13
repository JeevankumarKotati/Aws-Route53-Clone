'use client';

import React from 'react';
import { useNotification, NotificationItem } from '@/context/NotificationContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NotificationBanner() {
  const { notifications, dismiss } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {notifications.map((n) => (
        <BannerItem key={n.id} item={n} onDismiss={() => dismiss(n.id)} />
      ))}
    </div>
  );
}

function BannerItem({ item, onDismiss }: { item: NotificationItem; onDismiss: () => void }) {
  const typeConfig = {
    success: {
      bg: 'bg-[#ebf8f2] dark:bg-[#122e1c]',
      border: 'border-[#1d8102] dark:border-[#5bc87b]',
      text: 'text-[#16191f] dark:text-emerald-100',
      icon: <CheckCircle2 className="w-5 h-5 text-[#1d8102] dark:text-[#5bc87b] shrink-0" />
    },
    error: {
      bg: 'bg-[#fdf3f1] dark:bg-[#321614]',
      border: 'border-[#d13212] dark:border-[#eb6f5e]',
      text: 'text-[#16191f] dark:text-red-100',
      icon: <AlertCircle className="w-5 h-5 text-[#d13212] dark:text-[#eb6f5e] shrink-0" />
    },
    warning: {
      bg: 'bg-[#fff8e7] dark:bg-[#2e2610]',
      border: 'border-[#8d6b00] dark:border-[#e8b931]',
      text: 'text-[#16191f] dark:text-amber-100',
      icon: <AlertTriangle className="w-5 h-5 text-[#8d6b00] dark:text-[#e8b931] shrink-0" />
    },
    info: {
      bg: 'bg-[#f1faff] dark:bg-[#10273c]',
      border: 'border-[#0073bb] dark:border-[#539fe5]',
      text: 'text-[#16191f] dark:text-sky-100',
      icon: <Info className="w-5 h-5 text-[#0073bb] dark:text-[#539fe5] shrink-0" />
    }
  };

  const cfg = typeConfig[item.type];

  return (
    <div
      className={cn(
        'flex items-start justify-between p-3.5 border-l-4 rounded-[2px] shadow-xs transition-all',
        cfg.bg,
        cfg.border,
        cfg.text
      )}
    >
      <div className="flex items-start gap-3">
        {cfg.icon}
        <div>
          <div className="text-sm font-bold tracking-tight">{item.title}</div>
          {item.message && <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{item.message}</div>}
        </div>
      </div>
      {item.dismissible && (
        <button
          onClick={onDismiss}
          className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition rounded-xs"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
