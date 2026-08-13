'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Globe,
  Bell,
  Terminal,
  HelpCircle,
  Moon,
  Sun,
  User,
  ChevronDown,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { KeyboardShortcutsModal } from '@/components/common/KeyboardShortcutsModal';

const MOCK_ACCOUNTS = [
  { id: '123456789012', alias: 'production-main', role: 'AdministratorAccess' },
  { id: '987654321098', alias: 'staging-environment', role: 'DevOpsEngineer' },
  { id: '554433221100', alias: 'sandbox-developer', role: 'ReadOnlyAccess' }
];

export function AWSHeader() {
  const router = useRouter();
  const { user, switchAccount, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcuts: '/' to focus search, '?' for shortcuts, 'd' for dark mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen(true);
      } else if (e.key === 'd' || e.key === 'D') {
        toggleTheme();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/hosted-zones?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="h-10 bg-[#0f1b2a] text-white flex items-center justify-between px-3 text-xs select-none sticky top-0 z-40 border-b border-[#232f3e] shadow-xs">
        {/* Left: AWS Logo & Service Navigation */}
        <div className="flex items-center gap-4">
          <Link href="/hosted-zones" className="flex items-center gap-2 group py-1">
            {/* AWS Smile Cube Icon */}
            <div className="w-6 h-6 bg-[#ec7211] rounded-[2px] flex items-center justify-center font-bold text-white shadow-xs text-xs tracking-tighter">
              aws
            </div>
            <span className="font-bold text-sm tracking-wide text-white group-hover:text-[#ec7211] transition-colors">
              Route 53
            </span>
          </Link>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search zones, records... [/]"
                className="w-64 lg:w-80 h-7 pl-8 pr-12 text-xs bg-[#1e2b3c] hover:bg-[#253549] focus:bg-[#253549] text-white placeholder-gray-400 rounded-[2px] border border-gray-700 focus:border-[#ec7211] focus:outline-hidden transition"
              />
              <span className="absolute right-2 text-[10px] text-gray-400 font-mono bg-[#16202c] px-1.5 py-0.5 rounded-[2px] border border-gray-700">
                /
              </span>
            </div>
          </form>
        </div>

        {/* Right Navigation: CloudShell, Notifications, Global Region, Account, Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* CloudShell Icon Mock */}
          <button
            title="AWS CloudShell"
            className="p-1.5 text-gray-300 hover:text-white hover:bg-[#1e2b3c] rounded-[2px] transition hidden sm:flex items-center"
          >
            <Terminal className="w-4 h-4" />
          </button>

          {/* Notifications Bell Mock */}
          <button
            title="AWS Console Notifications"
            className="p-1.5 text-gray-300 hover:text-white hover:bg-[#1e2b3c] rounded-[2px] transition relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ec7211] rounded-full" />
          </button>

          {/* Region Badge: Global */}
          <div
            title="Route 53 is a Global DNS Service"
            className="px-2.5 py-1 text-gray-200 hover:bg-[#1e2b3c] rounded-[2px] flex items-center gap-1.5 cursor-default transition"
          >
            <Globe className="w-3.5 h-3.5 text-[#ec7211]" />
            <span className="font-semibold text-xs">Global</span>
          </div>

          {/* Help & Shortcuts Button */}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            title="Keyboard Shortcuts (?)"
            className="p-1.5 text-gray-300 hover:text-white hover:bg-[#1e2b3c] rounded-[2px] transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode (D)'}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-[#1e2b3c] rounded-[2px] transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-200" />}
          </button>

          <div className="h-4 w-px bg-gray-700 mx-1" />

          {/* Account / IAM Role Switcher */}
          <div className="relative" ref={accountMenuRef}>
            <button
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-100 hover:bg-[#1e2b3c] rounded-[2px] transition font-medium"
            >
              <User className="w-3.5 h-3.5 text-gray-300" />
              <span className="max-w-[140px] truncate">
                {user ? `${user.username} @ ${user.account_id}` : 'AWS Account'}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {accountMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-xl rounded-[2px] z-50 divide-y divide-gray-100 dark:divide-gray-800">
                {/* Active User Information */}
                <div className="p-3 bg-gray-50 dark:bg-[#161e2e]">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-[#ec7211]" />
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Active IAM Session
                    </span>
                  </div>
                  <div className="font-semibold text-sm">{user?.role_arn.split('/').pop()}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Account: <span className="font-mono">{user?.account_id}</span> ({user?.account_alias})
                  </div>
                </div>

                {/* Switch IAM Account / Role */}
                <div className="p-2">
                  <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 px-2 py-1 uppercase">
                    Switch Mock Account
                  </div>
                  {MOCK_ACCOUNTS.map((acc) => {
                    const isSelected = user?.account_id === acc.id;
                    return (
                      <button
                        key={acc.id}
                        onClick={() => {
                          switchAccount(acc.id, acc.alias, acc.role);
                          setAccountMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-xs rounded-[2px] flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-[#ec7211]/10 text-[#ec7211] font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div>
                          <div>{acc.role}</div>
                          <div className="text-[10px] text-gray-400">{acc.alias} ({acc.id})</div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#ec7211]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Sign out */}
                <div className="p-2 bg-gray-50 dark:bg-[#161e2e]">
                  <button
                    onClick={() => {
                      logout();
                      setAccountMenuOpen(false);
                      router.push('/login');
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-[2px] flex items-center gap-2 font-medium transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out of AWS Console
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </>
  );
}
