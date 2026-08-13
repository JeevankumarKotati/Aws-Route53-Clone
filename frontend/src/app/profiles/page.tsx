'use client';

import React from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Clock, Sliders } from 'lucide-react';

export default function ProfilesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'Route 53', href: '/profiles' }, { label: 'Profiles' }]} />

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          Route 53 Profiles
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Standardize DNS configurations and security rule groups across multiple AWS accounts and VPCs.
        </p>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-[2px] flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200">
          <span className="font-bold text-sm">Feature Preview – Coming Soon</span>
          <p className="mt-1 leading-relaxed">
            Route 53 Profiles multi-VPC policy propagation is currently in preview.
          </p>
        </div>
      </div>
    </div>
  );
}
