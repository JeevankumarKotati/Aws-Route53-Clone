'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { HostedZoneTable } from '@/components/hosted-zones/HostedZoneTable';
import { EditHostedZoneModal } from '@/components/hosted-zones/EditHostedZoneModal';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';
import { HostedZone } from '@/types/route53';
import { api } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

export default function HostedZonesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-gray-500">Loading hosted zones...</div>}>
      <HostedZonesContent />
    </Suspense>
  );
}

function HostedZonesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useNotification();

  const initialQuery = searchParams.get('q') || '';
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [zoneToEdit, setZoneToEdit] = useState<HostedZone | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<HostedZone | null>(null);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listHostedZones({
        query: searchQuery,
        zone_type: typeFilter
      });
      setZones(res.items);
    } catch (e: any) {
      notify('error', 'Failed to load hosted zones', e.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, notify]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Global Keyboard shortcuts: 'c' to create hosted zone, 'r' to refresh
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        router.push('/hosted-zones/create');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        fetchZones();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, fetchZones]);

  const handleEditZone = (zone: HostedZone) => {
    setZoneToEdit(zone);
    setEditModalOpen(true);
  };

  const handleSaveZone = async (id: string, comment: string, tags: Record<string, string>) => {
    try {
      const updated = await api.updateHostedZone(id, { comment, tags });
      notify('success', 'Hosted zone updated', `Changes to "${updated.name}" have been saved.`);
      fetchZones();
    } catch (e: any) {
      notify('error', 'Failed to update hosted zone', e.message);
      throw e;
    }
  };

  const handleDeleteZone = (zone: HostedZone) => {
    setZoneToDelete(zone);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!zoneToDelete) return;
    try {
      await api.deleteHostedZone(zoneToDelete.id);
      notify('success', 'Hosted zone deleted', `Hosted zone "${zoneToDelete.name}" was successfully deleted.`);
      fetchZones();
    } catch (e: any) {
      notify('error', 'Failed to delete hosted zone', e.message);
      throw e;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Route 53', href: '/hosted-zones' }, { label: 'Hosted zones' }]} />

      {/* Page Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Hosted zones <span className="text-sm font-normal text-gray-500">({zones.length})</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            A hosted zone contains records that tell the Domain Name System (DNS) how to route traffic for a domain.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <HostedZoneTable
        zones={zones}
        loading={loading}
        onRefresh={fetchZones}
        onDeleteZone={handleDeleteZone}
        onEditZone={handleEditZone}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      {/* Edit Modal */}
      <EditHostedZoneModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        zone={zoneToEdit}
        onSave={handleSaveZone}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Hosted Zone"
        itemName={zoneToDelete ? zoneToDelete.name : ''}
        itemType="hosted zone"
      />
    </div>
  );
}
