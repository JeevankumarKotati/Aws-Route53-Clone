'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { AWSButton } from '@/components/common/AWSButton';
import { api } from '@/lib/api';
import { DashboardStats } from '@/types/route53';
import { Layers, Globe, Activity, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Breadcrumbs items={[{ label: 'Route 53', href: '/dashboard' }, { label: 'Dashboard' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Route 53 Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Overview of DNS hosted zones and resources
          </p>
        </div>
        <AWSButton variant="primary" onClick={() => router.push('/hosted-zones/create')}>
          Create hosted zone
        </AWSButton>
      </div>

      {/* Basic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#161e2e] p-4 border border-gray-200 dark:border-gray-800 rounded-[2px]">
          <div className="text-xs text-gray-500 font-medium">Hosted Zones</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {stats ? stats.hosted_zones.total : 3}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {stats ? `${stats.hosted_zones.public} Public, ${stats.hosted_zones.private} Private` : '2 Public, 1 Private'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#161e2e] p-4 border border-gray-200 dark:border-gray-800 rounded-[2px]">
          <div className="text-xs text-gray-500 font-medium">DNS Records</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {stats ? stats.records.total : 19}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Total active DNS records
          </div>
        </div>

        <div className="bg-white dark:bg-[#161e2e] p-4 border border-gray-200 dark:border-gray-800 rounded-[2px]">
          <div className="text-xs text-gray-500 font-medium">Health Checks</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {stats ? stats.health_checks.total : 5}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">
            Active monitoring
          </div>
        </div>
      </div>

      {/* Quick link to Hosted zones */}
      <div className="p-4 bg-white dark:bg-[#161e2e] border border-gray-200 dark:border-gray-800 rounded-[2px] flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            Manage DNS Hosted Zones
          </div>
          <div className="text-xs text-gray-500">
            View, create, edit, or delete public and private hosted zones.
          </div>
        </div>
        <Link href="/hosted-zones">
          <AWSButton variant="secondary">
            Go to Hosted zones &rarr;
          </AWSButton>
        </Link>
      </div>
    </div>
  );
}
