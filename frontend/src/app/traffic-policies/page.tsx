'use client';

import React from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { AWSButton } from '@/components/common/AWSButton';
import { AWSBadge } from '@/components/common/AWSBadge';
import { GitBranch, Clock, Sparkles, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

export default function TrafficPoliciesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'Route 53', href: '/traffic-policies' }, { label: 'Traffic policies' }]} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Traffic Flow policies
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Simplify DNS routing with a visual drag-and-drop policy editor combining latency, failover, and geolocation rules.
          </p>
        </div>
        <AWSButton variant="primary" disabled>
          Create traffic policy
        </AWSButton>
      </div>

      {/* Coming Soon Notice Banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-[2px] flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200">
          <span className="font-bold text-sm">Feature Preview – Coming Soon</span>
          <p className="mt-1 leading-relaxed">
            Traffic Flow policy designer is currently mocked in this release. Core DNS routing policies (Weighted, Latency, Failover, Geolocation, Multi-value) are fully active and configurable in <a href="/hosted-zones" className="font-semibold underline">Hosted Zones</a>.
          </p>
        </div>
      </div>

      {/* Visual Mock of Policy List */}
      <div className="bg-white dark:bg-[#161e2e] border border-gray-200 dark:border-gray-800 rounded-[2px] overflow-hidden shadow-2xs">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 font-bold text-xs uppercase text-gray-500">
          Active Policies (Mock Preview)
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
          <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/40">
            <div className="flex items-center gap-3">
              <GitBranch className="w-5 h-5 text-[#ec7211]" />
              <div>
                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">Global-Multi-Region-Active-Passive</div>
                <div className="text-[11px] text-gray-500">Latency-based routing with automated US-East to EU-West failover</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AWSBadge variant="success">Version 3 (Active)</AWSBadge>
              <span className="text-gray-400 text-[11px]">Associated with 2 records</span>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/40">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-sky-500" />
              <div>
                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">Canary-Release-Traffic-Splitter</div>
                <div className="text-[11px] text-gray-500">90/10 Weighted distribution to canary endpoints with health checks</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AWSBadge variant="info">Version 1 (Active)</AWSBadge>
              <span className="text-gray-400 text-[11px]">Associated with 1 record</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
