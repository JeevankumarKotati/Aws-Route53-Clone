'use client';

import React, { useState } from 'react';
import { AWSModal } from '@/components/common/AWSModal';
import { AWSButton } from '@/components/common/AWSButton';
import { DNSRecord } from '@/types/route53';
import { Layers, Trash2, Clock } from 'lucide-react';

interface BulkOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecords: DNSRecord[];
  onBulkDelete: (recordIds: string[]) => Promise<void>;
  onBulkUpdateTTL: (recordIds: string[], ttl: number) => Promise<void>;
}

export function BulkOperationsModal({
  isOpen,
  onClose,
  selectedRecords,
  onBulkDelete,
  onBulkUpdateTTL
}: BulkOperationsModalProps) {
  const [activeTab, setActiveTab] = useState<'ttl' | 'delete'>('ttl');
  const [newTTL, setNewTTL] = useState(300);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTTLSubmit = async () => {
    setLoading(true);
    try {
      const ids = selectedRecords.map((r) => r.id);
      await onBulkUpdateTTL(ids, Number(newTTL));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') return;
    setLoading(true);
    try {
      const ids = selectedRecords.map((r) => r.id);
      await onBulkDelete(ids);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AWSModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Operations (${selectedRecords.length} records selected)`}
      maxWidth="lg"
      footer={
        <>
          <AWSButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AWSButton>
          {activeTab === 'ttl' ? (
            <AWSButton variant="primary" onClick={handleTTLSubmit} loading={loading}>
              Apply TTL to {selectedRecords.length} records
            </AWSButton>
          ) : (
            <AWSButton
              variant="danger"
              onClick={handleDeleteSubmit}
              disabled={deleteConfirmText.toLowerCase() !== 'delete' || loading}
              loading={loading}
            >
              Delete {selectedRecords.length} records
            </AWSButton>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Tab selector */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('ttl')}
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'ttl'
                ? 'border-[#ec7211] text-[#ec7211]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Bulk Update TTL
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'delete'
                ? 'border-red-500 text-red-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Bulk Delete
          </button>
        </div>

        {activeTab === 'ttl' ? (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Select new TTL for all {selectedRecords.length} records:
            </label>
            <select
              value={newTTL}
              onChange={(e) => setNewTTL(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
            >
              <option value={60}>60 seconds (1 minute)</option>
              <option value={300}>300 seconds (5 minutes)</option>
              <option value={900}>900 seconds (15 minutes)</option>
              <option value={3600}>3600 seconds (1 hour)</option>
              <option value={86400}>86400 seconds (1 day)</option>
            </select>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-200 rounded-[2px]">
              You are about to permanently delete <span className="font-bold">{selectedRecords.length}</span> DNS records. Apex SOA records will be protected from deletion.
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Type <span className="font-mono font-bold text-red-600">delete</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </AWSModal>
  );
}
