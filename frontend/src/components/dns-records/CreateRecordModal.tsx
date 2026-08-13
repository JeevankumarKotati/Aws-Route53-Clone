'use client';

import React, { useState } from 'react';
import { AWSModal } from '@/components/common/AWSModal';
import { AWSButton } from '@/components/common/AWSButton';
import { HostedZone, RecordType } from '@/types/route53';

interface CreateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: HostedZone;
  onCreate: (recordData: {
    name: string;
    type: string;
    ttl?: number;
    values: string[];
    routing_policy: string;
    routing_config: Record<string, any>;
    is_alias: boolean;
  }) => Promise<void>;
}

const RECORD_TYPES: RecordType[] = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA'];

export function CreateRecordModal({
  isOpen,
  onClose,
  zone,
  onCreate
}: CreateRecordModalProps) {
  const [subdomain, setSubdomain] = useState('');
  const [recordType, setRecordType] = useState<RecordType>('A');
  const [rawValues, setRawValues] = useState('');
  const [ttl, setTtl] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedValues = rawValues
      .split('\n')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (parsedValues.length === 0) {
      setError('Please enter at least one value for the record.');
      return;
    }

    const zoneClean = zone.name.endsWith('.') ? zone.name : `${zone.name}.`;
    const cleanSub = subdomain.trim();
    const fullName = cleanSub ? `${cleanSub}.${zoneClean}` : zoneClean;

    setLoading(true);
    try {
      await onCreate({
        name: fullName,
        type: recordType,
        ttl: Number(ttl) || 300,
        values: parsedValues,
        routing_policy: 'SIMPLE',
        routing_config: {},
        is_alias: false
      });
      setSubdomain('');
      setRawValues('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AWSModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create record"
      subtitle={`Zone: ${zone.name}`}
      maxWidth="lg"
      footer={
        <>
          <AWSButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AWSButton>
          <AWSButton variant="primary" onClick={handleSubmit} loading={loading}>
            Create record
          </AWSButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 rounded-[2px]">
            {error}
          </div>
        )}

        {/* Record Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Record name
          </label>
          <div className="flex items-stretch">
            <input
              type="text"
              placeholder="e.g. www, api (leave empty for apex)"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="grow px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-[2px]"
            />
            <div className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-r-[2px] text-gray-600 dark:text-gray-400">
              .{zone.name.replace(/\.$/, '')}
            </div>
          </div>
        </div>

        {/* Record Type & TTL */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Record type
            </label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as RecordType)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
            >
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              TTL (seconds)
            </label>
            <input
              type="number"
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
            />
          </div>
        </div>

        {/* Value */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Value / Route traffic to
          </label>
          <textarea
            rows={4}
            placeholder="Enter values (one per line)&#10;e.g. 192.0.2.1"
            value={rawValues}
            onChange={(e) => setRawValues(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] font-mono"
          />
        </div>
      </form>
    </AWSModal>
  );
}
