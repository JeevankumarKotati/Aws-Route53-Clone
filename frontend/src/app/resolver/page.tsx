'use client';

import React from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { AWSButton } from '@/components/common/AWSButton';
import { AWSBadge } from '@/components/common/AWSBadge';
import { Network, Shield, Clock } from 'lucide-react';

export default function ResolverPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'Route 53', href: '/resolver' }, { label: 'Route 53 Resolver' }]} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Route 53 Resolver
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Hybrid DNS resolution for AWS VPCs and on-premises enterprise data centers.
          </p>
        </div>
        <AWSButton variant="primary" disabled>
          Configure endpoints
        </AWSButton>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-[2px] flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200">
          <span className="font-bold text-sm">Feature Preview – Coming Soon</span>
          <p className="mt-1 leading-relaxed">
            Inbound and Outbound DNS Resolver Endpoints and DNS Firewall rules are mocked in this preview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-white dark:bg-[#161e2e] p-5 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-gray-100">
            <Network className="w-4 h-4 text-[#ec7211]" />
            Inbound Endpoints
          </div>
          <p className="text-gray-500">
            Allows DNS resolvers on your on-premises network to resolve domain names in your AWS Route 53 private hosted zones.
          </p>
          <div className="p-3 bg-gray-50 dark:bg-[#121927] border rounded-[2px] font-mono text-[11px] space-y-1">
            <div>Endpoint ID: <span className="font-bold">rslvr-in-0a1b2c3d4e5f</span></div>
            <div>VPC: vpc-0a1b2c3d4e5f6g7h8 (us-east-1)</div>
            <div>IPs: 10.0.1.4, 10.0.2.4</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161e2e] p-5 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-gray-100">
            <Shield className="w-4 h-4 text-sky-500" />
            Route 53 DNS Firewall
          </div>
          <p className="text-gray-500">
            Monitor and filter outbound DNS queries for malicious domains, botnets, and command-and-control servers.
          </p>
          <div className="p-3 bg-gray-50 dark:bg-[#121927] border rounded-[2px] font-mono text-[11px] space-y-1">
            <div>Rule Group: <span className="font-bold">AWSManagedDomainsThreatList</span></div>
            <div>Action: BLOCK (NXDOMAIN)</div>
            <div>Status: <span className="text-emerald-500 font-bold">Active</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
