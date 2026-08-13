'use client';

import React from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { AWSButton } from '@/components/common/AWSButton';
import { AWSBadge } from '@/components/common/AWSBadge';
import { Activity, CheckCircle2, AlertTriangle, Clock, ShieldCheck, Heart } from 'lucide-react';

export default function HealthChecksPage() {
  const mockChecks = [
    {
      id: 'hc-0192837465',
      name: 'prod-primary-alb-us-east-1',
      target: '198.51.100.10:443',
      type: 'HTTPS Endpoint',
      interval: '30s',
      status: 'Healthy',
      latency: '34ms',
      lastCheck: '12s ago'
    },
    {
      id: 'hc-9988776655',
      name: 'prod-canary-api-cluster',
      target: '198.51.100.20:443',
      type: 'HTTPS Endpoint',
      interval: '10s (Fast)',
      status: 'Healthy',
      latency: '42ms',
      lastCheck: '5s ago'
    },
    {
      id: 'hc-4433221100',
      name: 'standby-disaster-recovery-eu-west-1',
      target: '198.51.100.30:443',
      type: 'HTTPS Endpoint',
      interval: '30s',
      status: 'Healthy',
      latency: '88ms',
      lastCheck: '18s ago'
    },
    {
      id: 'hc-1122334455',
      name: 'legacy-auth-gateway-dc2',
      target: '203.0.113.88:8080',
      type: 'TCP Endpoint',
      interval: '30s',
      status: 'Degraded',
      latency: '2400ms',
      lastCheck: '2s ago'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'Route 53', href: '/health-checks' }, { label: 'Health checks' }]} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Health checks
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Monitor the health and performance of your web applications, endpoints, and other resources.
          </p>
        </div>
        <AWSButton variant="primary" disabled>
          Create health check
        </AWSButton>
      </div>

      {/* Coming soon banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-[2px] flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200">
          <span className="font-bold text-sm">Feature Preview – Coming Soon</span>
          <p className="mt-1 leading-relaxed">
            Live health checker daemons and SNS alarm triggers are mocked for this demonstration. Health Check IDs can be attached to failover and multivalue DNS records.
          </p>
        </div>
      </div>

      {/* Mock Table */}
      <div className="bg-white dark:bg-[#161e2e] border border-gray-200 dark:border-gray-800 rounded-[2px] overflow-hidden shadow-2xs">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 font-bold text-xs uppercase text-gray-500">
          Configured Health Checks ({mockChecks.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-[#121927] border-b border-gray-200 dark:border-gray-800 font-bold text-gray-500">
              <tr>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Health Check ID</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Target Endpoint</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Last Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {mockChecks.map((hc) => (
                <tr key={hc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-gray-100">{hc.name}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">{hc.id}</td>
                  <td className="py-2.5 px-3">
                    <AWSBadge variant={hc.status === 'Healthy' ? 'success' : 'error'}>
                      {hc.status}
                    </AWSBadge>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">{hc.target}</td>
                  <td className="py-2.5 px-3">{hc.type}</td>
                  <td className="py-2.5 px-3 font-mono">{hc.latency}</td>
                  <td className="py-2.5 px-3 text-gray-400">{hc.lastCheck}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
