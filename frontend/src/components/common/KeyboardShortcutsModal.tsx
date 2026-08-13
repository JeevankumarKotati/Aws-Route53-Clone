'use client';

import React from 'react';
import { AWSModal } from './AWSModal';
import { Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    { key: '/', desc: 'Focus global or table search bar' },
    { key: 'c', desc: 'Create new hosted zone or record' },
    { key: 'r', desc: 'Refresh records or zone list' },
    { key: 'd', desc: 'Toggle Dark / Light theme' },
    { key: '?', desc: 'Open this keyboard shortcuts dialog' },
    { key: 'Esc', desc: 'Close modals, drawers, and dropdowns' },
  ];

  return (
    <AWSModal
      isOpen={isOpen}
      onClose={onClose}
      title="AWS Console Keyboard Shortcuts"
      subtitle="Power shortcuts for Route 53 management"
      maxWidth="md"
    >
      <div className="space-y-3">
        <div className="border border-gray-200 dark:border-gray-700 rounded-[2px] divide-y divide-gray-200 dark:divide-gray-700">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#1e293b]">
              <span className="text-sm text-gray-700 dark:text-gray-300">{s.desc}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-xs shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </AWSModal>
  );
}
