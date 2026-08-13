'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AWSButton } from '@/components/common/AWSButton';
import { Shield, Lock, User, Key, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [accountId, setAccountId] = useState('123456789012');
  const [username, setUsername] = useState('admin');
  const [role, setRole] = useState('AdministratorAccess');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username.trim(), role, accountId.trim());
      router.push('/hosted-zones');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acc: string, user: string, r: string) => {
    setLoading(true);
    try {
      await login(user, r, acc);
      router.push('/hosted-zones');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#161e2e] border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-xl overflow-hidden">
        {/* AWS Header */}
        <div className="bg-[#0f1b2a] px-6 py-5 text-center border-b border-gray-800">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-[#ec7211] text-white font-bold text-base rounded-[2px] mb-2 shadow-xs">
            aws
          </div>
          <h2 className="text-base font-bold text-white tracking-wide">
            Amazon Web Services Sign-In
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            AWS Route 53 Console Management
          </p>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4 text-xs">
            {/* Account ID */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Account ID (12 digits) or Account Alias
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="123456789012"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] font-mono text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* IAM User Name */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                IAM User Name
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* IAM Role */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Assumed IAM Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100"
              >
                <option value="AdministratorAccess">AdministratorAccess (Full DNS Control)</option>
                <option value="DevOpsEngineer">DevOpsEngineer (Route53 + VPC Access)</option>
                <option value="ReadOnlyAccess">ReadOnlyAccess (Audit & Inspection)</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100"
              />
            </div>

            <AWSButton
              variant="primary"
              type="submit"
              loading={loading}
              className="w-full py-2.5 text-sm mt-2"
            >
              Sign In to Console
            </AWSButton>
          </form>

          {/* Quick 1-Click Demo Profiles */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Quick 1-Click Demo IAM Roles:
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('123456789012', 'admin', 'AdministratorAccess')}
                className="w-full p-2 text-left text-xs bg-gray-50 dark:bg-[#121927] hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[2px] flex items-center justify-between transition"
              >
                <div>
                  <span className="font-bold text-[#ec7211]">AdministratorAccess</span>
                  <div className="text-[10px] text-gray-400 font-mono">123456789012 (Production)</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('987654321098', 'devops-lead', 'DevOpsEngineer')}
                className="w-full p-2 text-left text-xs bg-gray-50 dark:bg-[#121927] hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[2px] flex items-center justify-between transition"
              >
                <div>
                  <span className="font-bold text-sky-600 dark:text-sky-400">DevOpsEngineer</span>
                  <div className="text-[10px] text-gray-400 font-mono">987654321098 (Staging)</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
