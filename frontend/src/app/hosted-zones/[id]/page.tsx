'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { RecordTable } from '@/components/dns-records/RecordTable';
import { CreateRecordModal } from '@/components/dns-records/CreateRecordModal';
import { EditRecordModal } from '@/components/dns-records/EditRecordModal';
import { BindImportModal } from '@/components/dns-records/BindImportModal';
import { BulkOperationsModal } from '@/components/dns-records/BulkOperationsModal';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import { AWSBadge } from '@/components/common/AWSBadge';
import { AWSButton } from '@/components/common/AWSButton';
import { HostedZone, DNSRecord } from '@/types/route53';
import { api } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { copyToClipboard, downloadFile, formatDate } from '@/lib/utils';
import {
  Layers,
  Copy,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Server,
  Globe,
  Lock,
  Tag,
  FileText
} from 'lucide-react';

export default function HostedZoneDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const zoneId = resolvedParams.id;
  const router = useRouter();
  const { notify } = useNotification();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [policyFilter, setPolicyFilter] = useState('ALL');

  // UI state
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [copiedZoneId, setCopiedZoneId] = useState(false);
  const [copiedNS, setCopiedNS] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<DNSRecord | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<DNSRecord | null>(null);

  const [bindImportModalOpen, setBindImportModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedBulkRecords, setSelectedBulkRecords] = useState<DNSRecord[]>([]);

  // Fetch Hosted Zone Details
  const fetchZone = useCallback(async () => {
    try {
      const data = await api.getHostedZone(zoneId);
      setZone(data);
    } catch (e: any) {
      notify('error', 'Hosted zone not found', e.message);
      router.push('/hosted-zones');
    }
  }, [zoneId, notify, router]);

  // Fetch Records
  const fetchRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const res = await api.listDNSRecords(zoneId, {
        query: searchQuery,
        record_type: typeFilter,
        routing_policy: policyFilter
      });
      setRecords(res.items);
    } catch (e: any) {
      notify('error', 'Failed to load DNS records', e.message);
    } finally {
      setRecordsLoading(false);
    }
  }, [zoneId, searchQuery, typeFilter, policyFilter, notify]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchZone(), fetchRecords()]).finally(() => setLoading(false));
  }, [fetchZone, fetchRecords]);

  // Keyboard shortcut: 'c' to create record, 'r' to refresh
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setCreateModalOpen(true);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        fetchRecords();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchRecords]);

  // Extract Name Servers from NS record for details header
  const nsRecord = records.find((r) => r.type === 'NS' && (r.name === zone?.name || r.name === `${zone?.name}.`));
  const nameServers: string[] = nsRecord?.values || [];

  const handleCopyZoneId = () => {
    if (zone) {
      copyToClipboard(zone.id);
      setCopiedZoneId(true);
      setTimeout(() => setCopiedZoneId(false), 2000);
    }
  };

  const handleCopyNameServers = () => {
    if (nameServers.length > 0) {
      copyToClipboard(nameServers.join('\n'));
      setCopiedNS(true);
      setTimeout(() => setCopiedNS(false), 2000);
    }
  };

  const handleCreateRecord = async (recordData: any) => {
    try {
      const created = await api.createDNSRecord(zoneId, recordData);
      notify('success', 'Record created', `Record "${created.name}" (${created.type}) has been created.`);
      fetchRecords();
      fetchZone();
    } catch (e: any) {
      throw e;
    }
  };

  const handleEditRecord = (record: DNSRecord) => {
    setRecordToEdit(record);
    setEditModalOpen(true);
  };

  const handleSaveEditRecord = async (recordId: string, data: Partial<DNSRecord>) => {
    try {
      await api.updateDNSRecord(zoneId, recordId, data);
      notify('success', 'Record updated', `Record "${data.name}" has been updated.`);
      fetchRecords();
    } catch (e: any) {
      throw e;
    }
  };

  const handleDeleteRecord = (record: DNSRecord) => {
    setRecordToDelete(record);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
      await api.deleteDNSRecord(zoneId, recordToDelete.id);
      notify('success', 'Record deleted', `Record "${recordToDelete.name}" (${recordToDelete.type}) was deleted.`);
      fetchRecords();
      fetchZone();
    } catch (e: any) {
      notify('error', 'Failed to delete record', e.message);
      throw e;
    }
  };

  const handleBulkOperations = (selected: DNSRecord[]) => {
    setSelectedBulkRecords(selected);
    setBulkModalOpen(true);
  };

  const handleBulkDelete = async (recordIds: string[]) => {
    try {
      const res = await api.bulkDeleteRecords(zoneId, recordIds);
      notify('success', 'Records deleted', res.message);
      fetchRecords();
      fetchZone();
    } catch (e: any) {
      notify('error', 'Bulk deletion failed', e.message);
      throw e;
    }
  };

  const handleBulkUpdateTTL = async (recordIds: string[], ttl: number) => {
    try {
      const res = await api.bulkUpdateTTL(zoneId, recordIds, ttl);
      notify('success', 'TTL updated', res.message);
      fetchRecords();
    } catch (e: any) {
      notify('error', 'Bulk TTL update failed', e.message);
      throw e;
    }
  };

  const handleExportBind = () => {
    window.open(api.getExportBindUrl(zoneId), '_blank');
    notify('info', 'Export initiated', `Downloading BIND zone file for ${zone?.name}`);
  };

  const handleExportJson = () => {
    window.open(api.getExportJsonUrl(zoneId), '_blank');
    notify('info', 'Export initiated', `Downloading Route 53 JSON file for ${zone?.name}`);
  };

  if (loading || !zone) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded-xs" />
        <div className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xs" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xs" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Route 53', href: '/hosted-zones' },
          { label: 'Hosted zones', href: '/hosted-zones' },
          { label: zone.name }
        ]}
      />

      {/* Zone Overview Banner Card */}
      <div className="bg-white dark:bg-[#161e2e] border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs overflow-hidden">
        {/* Header summary */}
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">
                {zone.name}
              </h1>
              <AWSBadge variant={zone.zone_type === 'PUBLIC' ? 'public' : 'private'}>
                {zone.zone_type === 'PUBLIC' ? 'Public zone' : 'Private zone'}
              </AWSBadge>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-[2px] border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> In sync
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <span>Hosted zone ID:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{zone.id}</span>
                <button
                  onClick={handleCopyZoneId}
                  className="p-1 hover:text-gray-900 dark:hover:text-white transition"
                  title="Copy Zone ID"
                >
                  {copiedZoneId ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <span>•</span>
              <div>
                Records: <span className="font-bold text-gray-800 dark:text-gray-200">{zone.record_count}</span>
              </div>

              <span>•</span>
              <div>
                Created: <span className="text-gray-600 dark:text-gray-300">{formatDate(zone.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="text-xs text-[#0073bb] dark:text-[#539fe5] hover:underline font-semibold flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-[2px] hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {detailsExpanded ? (
                <>
                  Hide zone details <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Hosted zone details <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Details Drawer */}
        {detailsExpanded && (
          <div className="p-4 sm:p-5 bg-gray-50 dark:bg-[#121927] border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Name Servers Delegation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#ec7211]" />
                  Authoritative Name Servers ({nameServers.length})
                </span>
                {nameServers.length > 0 && (
                  <button
                    onClick={handleCopyNameServers}
                    className="text-[11px] text-[#0073bb] dark:text-[#539fe5] hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copiedNS ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    Copy all nameservers
                  </button>
                )}
              </div>
              <div className="bg-white dark:bg-[#1e293b] p-3 rounded-[2px] border border-gray-200 dark:border-gray-700 font-mono text-[11px] space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
                {nameServers.map((ns, i) => (
                  <div key={i} className="pt-1 first:pt-0 text-gray-800 dark:text-gray-200">
                    {ns}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-500">
                Update your domain registrar with these 4 AWS Anycast name servers to delegate DNS traffic to Route 53.
              </p>
            </div>

            {/* Description & Tags */}
            <div className="space-y-4">
              <div>
                <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                  Description / Comment
                </span>
                <div className="bg-white dark:bg-[#1e293b] p-2.5 rounded-[2px] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  {zone.comment || <span className="italic text-gray-400">No description provided</span>}
                </div>
              </div>

              {zone.vpc_id && (
                <div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                    Associated VPC
                  </span>
                  <div className="bg-white dark:bg-[#1e293b] p-2.5 rounded-[2px] border border-gray-200 dark:border-gray-700 font-mono">
                    {zone.vpc_id} ({zone.vpc_region})
                  </div>
                </div>
              )}

              <div>
                <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-500" />
                  Assigned Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(zone.tags || {}).map(([k, v]) => (
                    <span
                      key={k}
                      className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-[2px] font-mono text-[11px]"
                    >
                      <span className="font-semibold text-gray-600 dark:text-gray-400">{k}:</span> {v}
                    </span>
                  ))}
                  {Object.keys(zone.tags || {}).length === 0 && (
                    <span className="text-gray-400 italic">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DNS Records Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Records <span className="text-xs font-normal text-gray-500">({records.length})</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Define routing behavior for traffic requesting domains in this zone.
          </p>
        </div>
      </div>

      {/* Records Table Component */}
      <RecordTable
        records={records}
        loading={recordsLoading}
        onRefresh={fetchRecords}
        onCreateRecord={() => setCreateModalOpen(true)}
        onEditRecord={handleEditRecord}
        onDeleteRecord={handleDeleteRecord}
        onImportZoneFile={() => setBindImportModalOpen(true)}
        onExportBind={handleExportBind}
        onExportJson={handleExportJson}
        onBulkOperations={handleBulkOperations}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        policyFilter={policyFilter}
        onPolicyFilterChange={setPolicyFilter}
      />

      {/* Modals */}
      <CreateRecordModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        zone={zone}
        onCreate={handleCreateRecord}
      />

      <EditRecordModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        zone={zone}
        record={recordToEdit}
        onSave={handleSaveEditRecord}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteRecord}
        title="Delete DNS Record"
        itemName={recordToDelete ? `${recordToDelete.name} (${recordToDelete.type})` : ''}
        itemType="DNS record"
      />

      <BindImportModal
        isOpen={bindImportModalOpen}
        onClose={() => setBindImportModalOpen(false)}
        zone={zone}
        onSuccess={() => {
          fetchRecords();
          fetchZone();
        }}
      />

      <BulkOperationsModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        selectedRecords={selectedBulkRecords}
        onBulkDelete={handleBulkDelete}
        onBulkUpdateTTL={handleBulkUpdateTTL}
      />
    </div>
  );
}
