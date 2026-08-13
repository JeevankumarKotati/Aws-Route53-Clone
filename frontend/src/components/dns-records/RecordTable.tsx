'use client';

import React, { useState } from 'react';
import { DNSRecord, RecordType, RoutingPolicy } from '@/types/route53';
import { AWSButton } from '@/components/common/AWSButton';
import { AWSBadge } from '@/components/common/AWSBadge';
import {
  Search,
  RefreshCw,
  Trash2,
  Edit2,
  Upload,
  Download,
  Layers,
  ChevronDown,
  ExternalLink,
  ShieldAlert,
  Copy,
  Check
} from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

interface RecordTableProps {
  records: DNSRecord[];
  loading: boolean;
  onRefresh: () => void;
  onCreateRecord: () => void;
  onEditRecord: (record: DNSRecord) => void;
  onDeleteRecord: (record: DNSRecord) => void;
  onImportZoneFile: () => void;
  onExportBind: () => void;
  onExportJson: () => void;
  onBulkOperations: (selected: DNSRecord[]) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  typeFilter: string;
  onTypeFilterChange: (t: string) => void;
  policyFilter: string;
  onPolicyFilterChange: (p: string) => void;
}

const RECORD_TYPES = ['ALL', 'A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA', 'SOA'];

export function RecordTable({
  records,
  loading,
  onRefresh,
  onCreateRecord,
  onEditRecord,
  onDeleteRecord,
  onImportZoneFile,
  onExportBind,
  onExportJson,
  onBulkOperations,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  policyFilter,
  onPolicyFilterChange
}: RecordTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const selectedRecords = records.filter((r) => selectedIds.includes(r.id));
  const isAllSelected = records.length > 0 && selectedIds.length === records.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map((r) => r.id));
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCopyValue = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Table Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#161e2e] p-3 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs">
        {/* Left Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <AWSButton variant="primary" onClick={onCreateRecord}>
            Create record
          </AWSButton>

          <AWSButton
            variant="secondary"
            disabled={selectedRecords.length !== 1}
            onClick={() => selectedRecords.length === 1 && onEditRecord(selectedRecords[0])}
            icon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit record
          </AWSButton>

          <AWSButton
            variant="secondary"
            disabled={selectedRecords.length === 0}
            onClick={() => {
              if (selectedRecords.length === 1) {
                onDeleteRecord(selectedRecords[0]);
              } else if (selectedRecords.length > 1) {
                onBulkOperations(selectedRecords);
              }
            }}
            icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
          >
            Delete {selectedRecords.length > 1 ? `(${selectedRecords.length})` : ''}
          </AWSButton>

          <AWSButton
            variant="secondary"
            onClick={onImportZoneFile}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            Import zone file
          </AWSButton>

          {/* Export Dropdown */}
          <div className="relative">
            <AWSButton
              variant="secondary"
              onClick={() => setExportOpen(!exportOpen)}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export <ChevronDown className="w-3 h-3 ml-0.5" />
            </AWSButton>

            {exportOpen && (
              <div className="absolute left-0 mt-1 w-52 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 shadow-xl rounded-[2px] z-50 py-1 text-xs">
                <button
                  onClick={() => {
                    setExportOpen(false);
                    onExportBind();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between"
                >
                  <span>Export BIND zone file (.zone)</span>
                </button>
                <button
                  onClick={() => {
                    setExportOpen(false);
                    onExportJson();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between"
                >
                  <span>Export Route 53 JSON</span>
                </button>
              </div>
            )}
          </div>

          {selectedRecords.length > 1 && (
            <AWSButton
              variant="secondary"
              onClick={() => onBulkOperations(selectedRecords)}
              icon={<Layers className="w-3.5 h-3.5" />}
            >
              Bulk actions
            </AWSButton>
          )}
        </div>

        {/* Right Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by record name, value... [/]"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-48 lg:w-60 pl-8 pr-3 py-1 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-[#0073bb]"
            />
          </div>

          {/* Record Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="px-2.5 py-1 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
          >
            {RECORD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All record types' : t}
              </option>
            ))}
          </select>

          {/* Routing Policy Filter */}
          <select
            value={policyFilter}
            onChange={(e) => onPolicyFilterChange(e.target.value)}
            className="px-2.5 py-1 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
          >
            <option value="ALL">All policies</option>
            <option value="SIMPLE">Simple</option>
            <option value="WEIGHTED">Weighted</option>
            <option value="LATENCY">Latency</option>
            <option value="FAILOVER">Failover</option>
            <option value="GEOLOCATION">Geolocation</option>
            <option value="MULTIVALUE">Multivalue</option>
          </select>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            title="Refresh records"
            className="p-1.5 border border-gray-300 dark:border-gray-600 rounded-[2px] hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#ec7211]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#161e2e] border border-gray-200 dark:border-gray-800 rounded-[2px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fafafa] dark:bg-[#121927] border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="accent-[#ec7211] cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">Record name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Routing policy</th>
                <th className="py-2.5 px-3">Differentiate / Alias</th>
                <th className="py-2.5 px-3">Value / Route traffic to</th>
                <th className="py-2.5 px-3 text-right">TTL (seconds)</th>
                <th className="py-2.5 px-3">Health check ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
              {records.map((rec) => {
                const isSelected = selectedIds.includes(rec.id);
                const isApexSOA = rec.type === 'SOA';

                return (
                  <tr
                    key={rec.id}
                    onClick={(e) => handleToggleRow(rec.id, e)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#ec7211]/10 dark:bg-[#ec7211]/20 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            setSelectedIds(selectedIds.filter((id) => id !== rec.id));
                          } else {
                            setSelectedIds([...selectedIds, rec.id]);
                          }
                        }}
                        className="accent-[#ec7211] cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-semibold font-mono text-gray-900 dark:text-gray-100">
                      {rec.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <AWSBadge
                        variant={
                          rec.type === 'A'
                            ? 'info'
                            : rec.type === 'CNAME'
                            ? 'success'
                            : rec.type === 'MX'
                            ? 'warning'
                            : rec.type === 'SOA' || rec.type === 'NS'
                            ? 'neutral'
                            : 'info'
                        }
                      >
                        {rec.type}
                      </AWSBadge>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {rec.routing_policy || 'Simple'}
                      </span>
                      {rec.routing_config && Object.keys(rec.routing_config).length > 0 && (
                        <div className="text-[10px] text-gray-400 font-mono">
                          {rec.routing_config.weight !== undefined && `Weight: ${rec.routing_config.weight}`}
                          {rec.routing_config.region && `Region: ${rec.routing_config.region}`}
                          {rec.routing_config.failover_role && `Role: ${rec.routing_config.failover_role}`}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {rec.is_alias ? (
                        <span className="text-[11px] font-bold text-[#0073bb] dark:text-[#539fe5] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-xs border border-blue-200 dark:border-blue-900">
                          Yes (Alias)
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">No</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {rec.is_alias ? (
                        <span className="text-[#0073bb] dark:text-[#539fe5] font-semibold">
                          {rec.alias_target}
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          {(rec.values || []).map((val, i) => (
                            <div key={i} className="flex items-center gap-1 group/val">
                              <span className="text-gray-800 dark:text-gray-200 break-all">{val}</span>
                              <button
                                onClick={(e) => handleCopyValue(val, `${rec.id}_${i}`, e)}
                                className="opacity-0 group-hover/val:opacity-100 p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                                title="Copy value"
                              >
                                {copiedId === `${rec.id}_${i}` ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                      {rec.is_alias ? '—' : rec.ttl || 300}
                    </td>
                    <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px]">
                      {rec.health_check_id || '—'}
                    </td>
                  </tr>
                );
              })}

              {records.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                        No records match the filter
                      </div>
                      <p className="text-xs">
                        Try modifying search or record type filters, or click &quot;Create record&quot; to add a new DNS record.
                      </p>
                      <div className="pt-2">
                        <AWSButton variant="primary" onClick={onCreateRecord}>
                          Create record
                        </AWSButton>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#fafafa] dark:bg-[#121927] border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{records.length}</span> records
          </div>
          <div>
            {selectedRecords.length > 0 && (
              <span className="text-xs text-[#ec7211] font-semibold">
                {selectedRecords.length} record(s) selected
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
