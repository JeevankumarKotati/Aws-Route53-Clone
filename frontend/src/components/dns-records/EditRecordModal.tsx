'use client';

import React, { useState, useEffect } from 'react';
import { AWSModal } from '@/components/common/AWSModal';
import { AWSButton } from '@/components/common/AWSButton';
import { HostedZone, DNSRecord, RecordType, RoutingPolicy } from '@/types/route53';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: HostedZone;
  record: DNSRecord | null;
  onSave: (recordId: string, data: Partial<DNSRecord>) => Promise<void>;
}

export function EditRecordModal({
  isOpen,
  onClose,
  zone,
  record,
  onSave
}: EditRecordModalProps) {
  const [subdomain, setSubdomain] = useState('');
  const [recordType, setRecordType] = useState<RecordType>('A');
  const [isAlias, setIsAlias] = useState(false);
  const [aliasTarget, setAliasTarget] = useState('');
  const [rawValues, setRawValues] = useState('');
  const [ttl, setTtl] = useState(300);
  const [routingPolicy, setRoutingPolicy] = useState<RoutingPolicy>('SIMPLE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      // Calculate subdomain relative to zone
      let cleanSub = record.name.replace(new RegExp(`\\.?${zone.name}\\.?$`), '');
      if (cleanSub === record.name) {
        cleanSub = '';
      }
      setSubdomain(cleanSub);
      setRecordType(record.type);
      setIsAlias(record.is_alias || false);
      setAliasTarget(record.alias_target || '');
      setRawValues((record.values || []).join('\n'));
      setTtl(record.ttl || 300);
      setRoutingPolicy(record.routing_policy || 'SIMPLE');
    }
  }, [record, zone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    setError(null);
    let parsedValues: string[] = [];
    if (!isAlias) {
      parsedValues = rawValues
        .split('\n')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      if (parsedValues.length === 0) {
        setError('Please enter at least one value for the record.');
        return;
      }
    } else {
      if (!aliasTarget.trim()) {
        setError('Please specify an Alias target.');
        return;
      }
    }

    const zoneClean = zone.name.endsWith('.') ? zone.name : `${zone.name}.`;
    const cleanSub = subdomain.trim();
    const fullName = cleanSub ? `${cleanSub}.${zoneClean}` : zoneClean;

    setLoading(true);
    try {
      await onSave(record.id, {
        name: fullName,
        type: recordType,
        ttl: isAlias ? undefined : Number(ttl),
        values: parsedValues,
        routing_policy: routingPolicy,
        is_alias: isAlias,
        alias_target: isAlias ? aliasTarget.trim() : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update record.');
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <AWSModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Record: ${record.name}`}
      subtitle={`Type: ${record.type} | ID: ${record.id}`}
      maxWidth="xl"
      footer={
        <>
          <AWSButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AWSButton>
          <AWSButton variant="primary" onClick={handleSubmit} loading={loading}>
            Save record changes
          </AWSButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 rounded-[2px]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Record name
          </label>
          <div className="flex items-stretch">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="grow px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-[2px] font-mono"
            />
            <div className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-r-[2px] text-gray-600 dark:text-gray-400 font-mono">
              .{zone.name.replace(/\.$/, '')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Record type
            </label>
            <input
              type="text"
              disabled
              value={recordType}
              className="w-full px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Routing Policy
            </label>
            <input
              type="text"
              disabled
              value={routingPolicy}
              className="w-full px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-500 font-semibold"
            />
          </div>
        </div>

        {isAlias ? (
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Alias target
            </label>
            <input
              type="text"
              value={aliasTarget}
              onChange={(e) => setAliasTarget(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] font-mono"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Value / Route traffic to
            </label>
            <textarea
              rows={4}
              value={rawValues}
              onChange={(e) => setRawValues(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] font-mono"
            />
          </div>
        )}

        {!isAlias && (
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              TTL (seconds)
            </label>
            <input
              type="number"
              value={ttl}
              onChange={(e) => setTtl(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
            />
          </div>
        )}
      </form>
    </AWSModal>
  );
}
