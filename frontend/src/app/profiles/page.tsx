'use client';

import React from 'react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export default function ProfilesPage() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Breadcrumbs items={[{ label: 'Route 53', href: '/profiles' }, { label: 'Profiles' }]} />

      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
        Profiles
      </h1>

      <div className="p-8 bg-white dark:bg-[#161e2e] border border-gray-200 dark:border-gray-800 rounded-[2px] text-center space-y-2">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
          Coming Soon
        </h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Route 53 Profiles management is currently under development.
        </p>
      </div>
    </div>
  );
}
