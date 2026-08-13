'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { AWSButton } from '@/components/common/AWSButton';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { QueryTrafficChart } from '@/components/dashboard/QueryTrafficChart';
import { DashboardStats } from '@/types/route53';
import { api } from '@/lib/api';
import { AWSBadge } from '@/components/common/AWSBadge';
import { formatDate } from '@/lib/utils';
import { Layers, Shield, Activity, ArrowRight, ExternalLink, Globe } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Route 53', href: '/dashboard' }, { label: 'Dashboard' }]} />

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Route 53 Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Highly available and scalable cloud Domain Name System (DNS) web service
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AWSButton variant="primary" onClick={() => router.push('/hosted-zones/create')}>
            Create hosted zone
          </AWSButton>
        </div>
      </div>

      {/* Metric Cards */}
      <MetricCards stats={stats} />

      {/* Query Traffic Chart */}
      <QueryTrafficChart />

      {/* Two Column Section: Recent Zones & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Zones Table */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161e2e] p-4 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Recently Created Hosted Zones
            </h3>
            <Link
              href="/hosted-zones"
              className="text-xs text-[#0073bb] dark:text-[#539fe5] hover:underline font-medium"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#121927] border-b border-gray-200 dark:border-gray-800 text-gray-500 font-bold uppercase text-[10px]">
                  <th className="py-2 px-3">Zone Name</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Zone ID</th>
                  <th className="py-2 px-3 text-center">Records</th>
                  <th className="py-2 px-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {stats?.recent_zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-2 px-3 font-semibold text-[#0073bb] dark:text-[#539fe5] hover:underline">
                      <Link href={`/hosted-zones/${zone.id}`}>{zone.name}</Link>
                    </td>
                    <td className="py-2 px-3">
                      <AWSBadge variant={zone.type === 'PUBLIC' ? 'public' : 'private'}>
                        {zone.type}
                      </AWSBadge>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-gray-500">{zone.id}</td>
                    <td className="py-2 px-3 text-center font-semibold">{zone.record_count}</td>
                    <td className="py-2 px-3 text-gray-400 text-[11px] whitespace-nowrap">
                      {formatDate(zone.created_at)}
                    </td>
                  </tr>
                ))}
                {(!stats || stats.recent_zones.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                      No hosted zones created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Features & Getting Started */}
        <div className="bg-white dark:bg-[#161e2e] p-4 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Route 53 Capabilities
          </h3>

          <div className="space-y-3 text-xs">
            <Link
              href="/hosted-zones"
              className="p-2.5 rounded-[2px] border border-gray-100 dark:border-gray-800 hover:border-[#ec7211]/50 bg-gray-50 dark:bg-[#121927] flex items-start gap-3 transition group"
            >
              <Layers className="w-4 h-4 text-[#ec7211] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#ec7211]">
                  DNS Management
                </div>
                <div className="text-[11px] text-gray-500">
                  Manage public and private hosted zones, standard records, and routing policies.
                </div>
              </div>
            </Link>

            <Link
              href="/traffic-policies"
              className="p-2.5 rounded-[2px] border border-gray-100 dark:border-gray-800 hover:border-[#ec7211]/50 bg-gray-50 dark:bg-[#121927] flex items-start gap-3 transition group"
            >
              <Globe className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#ec7211]">
                  Traffic Flow Policies
                </div>
                <div className="text-[11px] text-gray-500">
                  Complex routing policies using visual drag-and-drop editor.
                </div>
              </div>
            </Link>

            <Link
              href="/health-checks"
              className="p-2.5 rounded-[2px] border border-gray-100 dark:border-gray-800 hover:border-[#ec7211]/50 bg-gray-50 dark:bg-[#121927] flex items-start gap-3 transition group"
            >
              <Activity className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#ec7211]">
                  Health Checking & Failover
                </div>
                <div className="text-[11px] text-gray-500">
                  Automated endpoint health monitoring and DNS failover.
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
