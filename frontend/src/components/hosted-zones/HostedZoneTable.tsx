'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HostedZone } from '@/types/route53';
import { AWSButton } from '@/components/common/AWSButton';
import { AWSBadge } from '@/components/common/AWSBadge';
import { formatDate } from '@/lib/utils';
import {
  Search,
  RefreshCw,
  Trash2,
  Edit2,
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';

interface HostedZoneTableProps {
  zones: HostedZone[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteZone: (zone: HostedZone) => void;
  onEditZone: (zone: HostedZone) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  typeFilter: string;
  onTypeFilterChange: (t: string) => void;
}

export function HostedZoneTable({
  zones,
  loading,
  onRefresh,
  onDeleteZone,
  onEditZone,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange
}: HostedZoneTableProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedZone = zones.find((z) => z.id === selectedId) || null;

  const handleRowClick = (zone: HostedZone) => {
    if (selectedId === zone.id) {
      setSelectedId(null);
    } else {
      setSelectedId(zone.id);
    }
  };

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(zones, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `route53_hosted_zones_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-3">
      {/* Table Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#161e2e] p-3 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs">
        {/* Left: Actions (Create, View, Edit, Delete) */}
        <div className="flex flex-wrap items-center gap-2">
          <AWSButton
            variant="primary"
            onClick={() => router.push('/hosted-zones/create')}
          >
            Create hosted zone
          </AWSButton>

          <AWSButton
            variant="secondary"
            disabled={!selectedZone}
            onClick={() => selectedZone && router.push(`/hosted-zones/${selectedZone.id}`)}
          >
            View details
          </AWSButton>

          <AWSButton
            variant="secondary"
            disabled={!selectedZone}
            onClick={() => selectedZone && onEditZone(selectedZone)}
            icon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </AWSButton>

          <AWSButton
            variant="secondary"
            disabled={!selectedZone}
            onClick={() => selectedZone && onDeleteZone(selectedZone)}
            icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
          >
            Delete
          </AWSButton>
        </div>

        {/* Right: Search, Filter, Export & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Find zones by name, ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-48 lg:w-64 pl-8 pr-3 py-1 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#0073bb] focus:border-[#0073bb]"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="px-2.5 py-1 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-[#0073bb]"
          >
            <option value="ALL">All Types</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>

          {/* Export button */}
          <button
            onClick={handleExportAll}
            title="Export zones as JSON"
            className="p-1.5 border border-gray-300 dark:border-gray-600 rounded-[2px] hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            title="Refresh list"
            className="p-1.5 border border-gray-300 dark:border-gray-600 rounded-[2px] hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#ec7211]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hosted Zones Table */}
      <div className="bg-white dark:bg-[#161e2e] border border-gray-200 dark:border-gray-800 rounded-[2px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fafafa] dark:bg-[#121927] border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-10 text-center">
                  {/* Select indicator */}
                </th>
                <th className="py-2.5 px-3">Hosted zone name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Hosted zone ID</th>
                <th className="py-2.5 px-3 text-center">Record count</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Tags</th>
                <th className="py-2.5 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
              {zones.map((zone) => {
                const isSelected = selectedId === zone.id;
                const tagCount = Object.keys(zone.tags || {}).length;

                return (
                  <tr
                    key={zone.id}
                    onClick={() => handleRowClick(zone)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#ec7211]/10 dark:bg-[#ec7211]/20 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <td className="py-2 px-3 text-center">
                      <input
                        type="radio"
                        name="selected_zone"
                        checked={isSelected}
                        onChange={() => setSelectedId(zone.id)}
                        className="accent-[#ec7211] cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-3 font-semibold text-[#0073bb] dark:text-[#539fe5] hover:underline">
                      <Link
                        href={`/hosted-zones/${zone.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5"
                      >
                        {zone.name}
                      </Link>
                    </td>
                    <td className="py-2 px-3">
                      <AWSBadge variant={zone.zone_type === 'PUBLIC' ? 'public' : 'private'}>
                        {zone.zone_type === 'PUBLIC' ? 'Public' : 'Private'}
                      </AWSBadge>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-gray-600 dark:text-gray-400">
                      {zone.id}
                    </td>
                    <td className="py-2 px-3 text-center font-semibold">
                      {zone.record_count}
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {zone.comment || '—'}
                    </td>
                    <td className="py-2 px-3">
                      {tagCount > 0 ? (
                        <span className="text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-[2px] border border-gray-200 dark:border-gray-700">
                          {tagCount} {tagCount === 1 ? 'tag' : 'tags'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-[11px]">
                      {formatDate(zone.created_at)}
                    </td>
                  </tr>
                );
              })}

              {zones.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                        No hosted zones found
                      </div>
                      <p className="text-xs">
                        {searchQuery
                          ? `No zones matched query "${searchQuery}". Try clearing filters.`
                          : 'Get started by creating your first Amazon Route 53 hosted zone.'}
                      </p>
                      <div>
                        <AWSButton variant="primary" onClick={() => router.push('/hosted-zones/create')}>
                          Create hosted zone
                        </AWSButton>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Count summary */}
        <div className="px-4 py-2.5 bg-[#fafafa] dark:bg-[#121927] border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{zones.length}</span> hosted zones
          </div>
          <div className="flex items-center gap-2">
            {selectedZone && (
              <span className="text-xs text-[#ec7211] font-semibold">
                Selected: {selectedZone.name} ({selectedZone.id})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
