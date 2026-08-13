'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { AWSButton } from '@/components/common/AWSButton';
import { api } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { Globe, Lock, Plus, Trash2, Info, AlertCircle } from 'lucide-react';

const AWS_REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)' },
  { id: 'us-east-2', name: 'US East (Ohio)' },
  { id: 'us-west-1', name: 'US West (N. California)' },
  { id: 'us-west-2', name: 'US West (Oregon)' },
  { id: 'eu-west-1', name: 'Europe (Ireland)' },
  { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
];

export default function CreateHostedZonePage() {
  const router = useRouter();
  const { notify } = useNotification();

  const [domainName, setDomainName] = useState('');
  const [comment, setComment] = useState('');
  const [zoneType, setZoneType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [vpcRegion, setVpcRegion] = useState('us-east-1');
  const [vpcId, setVpcId] = useState('');
  const [tags, setTags] = useState<{ key: string; value: string }[]>([
    { key: 'Environment', value: 'Production' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    setTags([...tags, { key: '', value: '' }]);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagChange = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...tags];
    next[index][field] = val;
    setTags(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanDomain = domainName.trim();
    if (!cleanDomain) {
      setError('Please enter a valid domain name.');
      return;
    }

    // Basic domain validation
    if (!cleanDomain.includes('.') || cleanDomain.startsWith('.') || cleanDomain.endsWith('.')) {
      if (!cleanDomain.includes('.')) {
        setError('Domain name must contain a top-level domain (e.g. example.com).');
        return;
      }
    }

    if (zoneType === 'PRIVATE' && !vpcId.trim()) {
      setError('Please provide a VPC ID for the private hosted zone.');
      return;
    }

    const tagsObj: Record<string, string> = {};
    tags.forEach(({ key, value }) => {
      if (key.trim()) {
        tagsObj[key.trim()] = value.trim();
      }
    });

    setLoading(true);
    try {
      const created = await api.createHostedZone({
        name: cleanDomain,
        comment: comment.trim() || undefined,
        zone_type: zoneType,
        vpc_region: zoneType === 'PRIVATE' ? vpcRegion : undefined,
        vpc_id: zoneType === 'PRIVATE' ? vpcId.trim() : undefined,
        tags: tagsObj
      });

      notify(
        'success',
        'Hosted zone created successfully',
        `Hosted zone "${created.name}" (${created.id}) has been created with default NS and SOA records.`
      );
      router.push(`/hosted-zones/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create hosted zone.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Route 53', href: '/hosted-zones' },
          { label: 'Hosted zones', href: '/hosted-zones' },
          { label: 'Create hosted zone' }
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Create hosted zone
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          A hosted zone tells Route 53 how to respond to DNS queries for your domain.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 rounded-[2px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hosted zone configuration card */}
        <div className="bg-white dark:bg-[#161e2e] p-5 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-2">
            Hosted zone configuration
          </h2>

          {/* Domain name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Domain name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. example.com, mycompany.internal"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-[#0073bb] focus:border-[#0073bb]"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Enter the fully qualified domain name (FQDN). You can create records in this hosted zone after creation.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Description – <span className="text-gray-400 font-normal italic">optional</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Production domain for web apps and microservices"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-[#0073bb]"
            />
          </div>

          {/* Type: Public vs Private Zone */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Public Zone Option */}
              <label
                className={`p-3.5 border rounded-[2px] cursor-pointer flex items-start gap-3 transition ${
                  zoneType === 'PUBLIC'
                    ? 'border-[#ec7211] bg-[#ec7211]/5 dark:bg-[#ec7211]/10'
                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="zone_type"
                  checked={zoneType === 'PUBLIC'}
                  onChange={() => setZoneType('PUBLIC')}
                  className="accent-[#ec7211] mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Public hosted zone
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Determines how traffic is routed on the internet. Route 53 assigns four unique Anycast authoritative name servers.
                  </p>
                </div>
              </label>

              {/* Private Zone Option */}
              <label
                className={`p-3.5 border rounded-[2px] cursor-pointer flex items-start gap-3 transition ${
                  zoneType === 'PRIVATE'
                    ? 'border-[#ec7211] bg-[#ec7211]/5 dark:bg-[#ec7211]/10'
                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="zone_type"
                  checked={zoneType === 'PRIVATE'}
                  onChange={() => setZoneType('PRIVATE')}
                  className="accent-[#ec7211] mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Private hosted zone
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Determines how traffic is routed within one or more Amazon Virtual Private Clouds (VPCs).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* VPC Configuration for Private Zone */}
          {zoneType === 'PRIVATE' && (
            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-[2px] space-y-3">
              <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
                VPCs to associate with the private hosted zone
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    VPC Region
                  </label>
                  <select
                    value={vpcRegion}
                    onChange={(e) => setVpcRegion(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
                  >
                    {AWS_REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    VPC ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. vpc-0a1b2c3d4e5f6g7h8"
                    value={vpcId}
                    onChange={(e) => setVpcId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags card */}
        <div className="bg-white dark:bg-[#161e2e] p-5 border border-gray-200 dark:border-gray-800 rounded-[2px] shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Tags – <span className="text-gray-400 font-normal italic">optional</span>
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              className="text-xs text-[#0073bb] dark:text-[#539fe5] hover:underline font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add tag
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {tags.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. Project)"
                  value={t.key}
                  onChange={(e) => handleTagChange(idx, 'key', e.target.value)}
                  className="w-1/2 px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. CloudScale)"
                  value={t.value}
                  onChange={(e) => handleTagChange(idx, 'value', e.target.value)}
                  className="w-1/2 px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-xs"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <AWSButton
            variant="secondary"
            type="button"
            onClick={() => router.push('/hosted-zones')}
            disabled={loading}
          >
            Cancel
          </AWSButton>
          <AWSButton
            variant="primary"
            type="submit"
            loading={loading}
          >
            Create hosted zone
          </AWSButton>
        </div>
      </form>
    </div>
  );
}
