'use client';

import React from 'react';
import { DashboardStats } from '@/types/route53';
import { Layers, Activity, GitBranch, Globe, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface MetricCardsProps {
  stats: DashboardStats | null;
}

export function MetricCards({ stats }: MetricCardsProps) {
  if (!stats) {
    return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-[2px]" />
      ))}
    </div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Hosted Zones Card */}
      <div className="bg-white dark:bg-[#161e2e] p-4 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Hosted Zones
          </span>
          <Layers className="w-4 h-4 text-[#ec7211]" />
        </div>
        <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {stats.hosted_zones.total}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="text-blue-600 font-semibold">{stats.hosted_zones.public} Public</span>
          <span>•</span>
          <span className="text-purple-600 font-semibold">{stats.hosted_zones.private} Private</span>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Link href="/hosted-zones" className="text-xs text-[#0073bb] dark:text-[#539fe5] hover:underline font-medium">
            View all hosted zones &rarr;
          </Link>
        </div>
      </div>

      {/* DNS Records Card */}
      <div className="bg-white dark:bg-[#161e2e] p-4 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            DNS Records
          </span>
          <Globe className="w-4 h-4 text-sky-500" />
        </div>
        <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {stats.records.total}
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Across {stats.hosted_zones.total} active hosted zones
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-2 text-[10px] font-mono">
          {Object.entries(stats.records.by_type || {}).slice(0, 3).map(([type, cnt]) => (
            <span key={type} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-[2px]">
              {type}: {cnt}
            </span>
          ))}
        </div>
      </div>

      {/* Health Checks Card */}
      <div className="bg-white dark:bg-[#161e2e] p-4 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Health Checks
          </span>
          <Activity className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>{stats.health_checks.total}</span>
          <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {stats.health_checks.healthy} Healthy
          </span>
        </div>
        <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> {stats.health_checks.unhealthy} Degraded endpoint
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Link href="/health-checks" className="text-xs text-[#0073bb] dark:text-[#539fe5] hover:underline font-medium">
            Manage health checks &rarr;
          </Link>
        </div>
      </div>

      {/* 24h DNS Query Traffic Card */}
      <div className="bg-white dark:bg-[#161e2e] p-4 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            24h Query Volume
          </span>
          <GitBranch className="w-4 h-4 text-purple-500" />
        </div>
        <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {stats.query_volume_24h}
        </div>
        <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
          ↑ 14.2% from previous day
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-400">100% SLA uptime</span>
        </div>
      </div>
    </div>
  );
}
