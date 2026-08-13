'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  GitBranch,
  Activity,
  Network,
  Shield,
  Sliders,
  Globe2,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavSection {
  title?: string;
  items: {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
    isPlaceholder?: boolean;
  }[];
}

export function AWSSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sections: NavSection[] = [
    {
      items: [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'DNS management',
      items: [
        {
          label: 'Hosted zones',
          href: '/hosted-zones',
          icon: <Layers className="w-4 h-4" />
        },
        {
          label: 'Traffic policies',
          href: '/traffic-policies',
          icon: <GitBranch className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Health checking',
      items: [
        {
          label: 'Health checks',
          href: '/health-checks',
          icon: <Activity className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Route 53 Resolver',
      items: [
        {
          label: 'Resolver VPCs',
          href: '/resolver',
          icon: <Network className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'Configuration',
      items: [
        {
          label: 'Profiles',
          href: '/profiles',
          icon: <Sliders className="w-4 h-4" />
        },
        {
          label: 'Registered domains',
          href: '/domains',
          icon: <Globe2 className="w-4 h-4" />
        }
      ]
    }
  ];

  return (
    <aside
      className={cn(
        'bg-white dark:bg-[#161e2e] border-r border-gray-200 dark:border-gray-800 transition-all duration-200 flex flex-col shrink-0 select-none z-30',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      {/* Sidebar Header */}
      <div className="h-12 flex items-center justify-between px-3.5 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <div className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>Route 53</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-[2px] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition ml-auto"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 text-xs">
        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {sec.title && !collapsed && (
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {sec.title}
              </div>
            )}
            {sec.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-[2px] font-medium transition-colors relative group',
                    isActive
                      ? 'bg-[#ec7211]/10 text-[#ec7211] dark:bg-[#ec7211]/20 font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-1 before:bg-[#ec7211] before:rounded-r-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
                  )}
                >
                  <span className={cn('shrink-0', isActive ? 'text-[#ec7211]' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300')}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500">
          <div className="font-semibold text-gray-600 dark:text-gray-400">AWS Route 53 Console</div>
          <div>v1.0.0 (Clone Edition)</div>
        </div>
      )}
    </aside>
  );
}
