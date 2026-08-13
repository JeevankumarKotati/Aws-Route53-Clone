'use client';

import React, { useState } from 'react';
import { AWSModal } from './AWSModal';
import { AWSButton } from './AWSButton';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  itemName: string;
  itemType?: string; // 'hosted zone' | 'record' | 'records'
  requireExactMatch?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = 'hosted zone',
  requireExactMatch = false
}: DeleteConfirmModalProps) {
  const [confirmInput, setConfirmInput] = useState('');
  const [loading, setLoading] = useState(false);

  const targetMatch = requireExactMatch ? itemName : 'delete';
  const isMatch = confirmInput.trim().toLowerCase() === targetMatch.toLowerCase();

  const handleConfirm = async () => {
    if (!isMatch) return;
    setLoading(true);
    try {
      await onConfirm();
      setConfirmInput('');
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AWSModal
      isOpen={isOpen}
      onClose={() => {
        setConfirmInput('');
        onClose();
      }}
      title={title}
      maxWidth="md"
      footer={
        <>
          <AWSButton
            variant="secondary"
            onClick={() => {
              setConfirmInput('');
              onClose();
            }}
            disabled={loading}
          >
            Cancel
          </AWSButton>
          <AWSButton
            variant="danger"
            onClick={handleConfirm}
            disabled={!isMatch || loading}
            loading={loading}
          >
            Delete
          </AWSButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[2px] text-red-900 dark:text-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold">Permanently delete {itemType}?</span> This action cannot be undone. All DNS queries routed to <code className="font-mono font-bold bg-white/70 dark:bg-black/30 px-1 py-0.5 rounded-xs">{itemName}</code> will fail immediately.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            To confirm deletion, type <span className="font-mono font-bold text-red-600 dark:text-red-400">{targetMatch}</span> below:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={targetMatch}
            className="w-full px-3 py-1.5 text-sm bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-red-500 focus:border-red-500 font-mono"
            autoFocus
          />
        </div>
      </div>
    </AWSModal>
  );
}
