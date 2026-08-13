'use client';

import React, { useState, useEffect } from 'react';
import { AWSModal } from '@/components/common/AWSModal';
import { AWSButton } from '@/components/common/AWSButton';
import { HostedZone } from '@/types/route53';
import { Plus, Trash2 } from 'lucide-react';

interface EditHostedZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: HostedZone | null;
  onSave: (id: string, comment: string, tags: Record<string, string>) => Promise<void>;
}

export function EditHostedZoneModal({
  isOpen,
  onClose,
  zone,
  onSave
}: EditHostedZoneModalProps) {
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (zone) {
      setComment(zone.comment || '');
      const tagEntries = Object.entries(zone.tags || {}).map(([key, value]) => ({ key, value }));
      setTags(tagEntries);
    }
  }, [zone]);

  const handleAddTag = () => {
    setTags([...tags, { key: '', value: '' }]);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagChange = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...tags];
    next[index][field] = val;
    setTags(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) return;

    setLoading(true);
    try {
      const tagsObj: Record<string, string> = {};
      tags.forEach(({ key, value }) => {
        if (key.trim()) {
          tagsObj[key.trim()] = value.trim();
        }
      });
      await onSave(zone.id, comment, tagsObj);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!zone) return null;

  return (
    <AWSModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Hosted Zone: ${zone.name}`}
      subtitle={`Zone ID: ${zone.id} (${zone.zone_type})`}
      maxWidth="lg"
      footer={
        <>
          <AWSButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AWSButton>
          <AWSButton variant="primary" onClick={handleSubmit} loading={loading}>
            Save changes
          </AWSButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description / Comment */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Optional comment describing the purpose of this hosted zone"
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-[#0073bb] focus:border-[#0073bb]"
          />
        </div>

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Tags ({tags.length})
            </label>
            <button
              type="button"
              onClick={handleAddTag}
              className="text-xs text-[#0073bb] dark:text-[#539fe5] hover:underline flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add tag
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {tags.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. Environment)"
                  value={t.key}
                  onChange={(e) => handleTagChange(idx, 'key', e.target.value)}
                  className="w-1/2 px-2.5 py-1 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Production)"
                  value={t.value}
                  onChange={(e) => handleTagChange(idx, 'value', e.target.value)}
                  className="w-1/2 px-2.5 py-1 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-xs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {tags.length === 0 && (
              <div className="text-xs text-gray-400 italic py-2 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-[2px]">
                No tags assigned. Click &quot;Add tag&quot; to attach key-value pairs.
              </div>
            )}
          </div>
        </div>
      </form>
    </AWSModal>
  );
}
