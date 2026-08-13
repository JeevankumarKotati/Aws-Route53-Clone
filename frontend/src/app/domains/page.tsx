'use client';

import React from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Clock, Globe2 } from 'lucide-react';

export default function DomainsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'Route 53', href: '/domains' }, { label: 'Registered domains' }]} />

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          Registered domains
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Register, transfer, and manage top-level domain names directly in AWS.
        </p>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-[2px] flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200">
          <span className="font-bold text-sm">Feature Preview – Coming Soon</span>
          <p className="mt-1 leading-relaxed">
            Domain registration registrar operations are mocked for this demo. You can manage DNS for any domain name in <a href="/hosted-zones" className="font-semibold underline">Hosted Zones</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
