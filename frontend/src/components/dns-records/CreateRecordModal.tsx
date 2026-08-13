'use client';

import React, { useState } from 'react';
import { AWSModal } from '@/components/common/AWSModal';
import { AWSButton } from '@/components/common/AWSButton';
import { HostedZone, RecordType, RoutingPolicy } from '@/types/route53';
import { Info, HelpCircle, Layers, GitFork } from 'lucide-react';

interface CreateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: HostedZone;
  onCreate: (recordData: {
    name: string;
    type: string;
    ttl?: number;
    values: string[];
    routing_policy: string;
    routing_config: Record<string, any>;
    is_alias: boolean;
    alias_target?: string;
    health_check_id?: string;
  }) => Promise<void>;
}

const RECORD_TYPES: { type: RecordType; label: string; placeholder: string; example: string }[] = [
  { type: 'A', label: 'A – Routes traffic to an IPv4 address and some AWS resources', placeholder: '192.0.2.1\n198.51.100.2', example: '192.0.2.1' },
  { type: 'AAAA', label: 'AAAA – Routes traffic to an IPv6 address and some AWS resources', placeholder: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', example: '2001:db8::1' },
  { type: 'CNAME', label: 'CNAME – Routes traffic to another domain name or subdomain', placeholder: 'example.com\napp.internal.domain', example: 'app.example.com' },
  { type: 'TXT', label: 'TXT – Verification and security (SPF, DKIM, DMARC)', placeholder: '"v=spf1 include:amazonses.com ~all"\n"google-site-verification=abc123xyz"', example: '"v=spf1 ..."' },
  { type: 'MX', label: 'MX – Routes email to mail servers (Priority + Server)', placeholder: '10 inbound-smtp.us-east-1.amazonaws.com\n20 inbound-smtp.us-west-2.amazonaws.com', example: '10 mail.example.com' },
  { type: 'NS', label: 'NS – Authoritative Name Servers', placeholder: 'ns-1.awsdns-01.org\nns-2.awsdns-02.co.uk', example: 'ns-1.awsdns-01.org' },
  { type: 'PTR', label: 'PTR – Maps an IP address to a domain name (Reverse DNS)', placeholder: 'hostname.example.com', example: 'server1.example.com' },
  { type: 'SRV', label: 'SRV – Service locator record (Priority Weight Port Target)', placeholder: '10 60 5060 bigbox.example.com', example: '10 60 5060 server.example.com' },
  { type: 'CAA', label: 'CAA – Certificate Authority Authorization', placeholder: '0 issue "amazon.com"\n0 issuewild ";"', example: '0 issue "letsencrypt.org"' },
];

const AWS_REGIONS = [
  'us-east-1 (N. Virginia)',
  'us-east-2 (Ohio)',
  'us-west-1 (N. California)',
  'us-west-2 (Oregon)',
  'eu-west-1 (Ireland)',
  'eu-central-1 (Frankfurt)',
  'ap-south-1 (Mumbai)',
  'ap-southeast-1 (Singapore)',
  'ap-northeast-1 (Tokyo)'
];

export function CreateRecordModal({
  isOpen,
  onClose,
  zone,
  onCreate
}: CreateRecordModalProps) {
  const [mode, setMode] = useState<'quick' | 'wizard'>('quick');
  const [subdomain, setSubdomain] = useState('');
  const [recordType, setRecordType] = useState<RecordType>('A');
  const [isAlias, setIsAlias] = useState(false);
  const [aliasTarget, setAliasTarget] = useState('');
  const [rawValues, setRawValues] = useState('');
  const [ttl, setTtl] = useState(300);
  const [routingPolicy, setRoutingPolicy] = useState<RoutingPolicy>('SIMPLE');
  
  // Routing config
  const [weight, setWeight] = useState(100);
  const [selectedRegion, setSelectedRegion] = useState(AWS_REGIONS[0]);
  const [failoverRole, setFailoverRole] = useState<'PRIMARY' | 'SECONDARY'>('PRIMARY');
  const [geoLocation, setGeoLocation] = useState('Default');
  const [recordSetId, setRecordSetId] = useState('');
  const [healthCheckId, setHealthCheckId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTypeConfig = RECORD_TYPES.find((t) => t.type === recordType) || RECORD_TYPES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    let parsedValues: string[] = [];
    if (!isAlias) {
      parsedValues = rawValues
        .split('\n')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      if (parsedValues.length === 0) {
        setError('Please enter at least one value for the record.');
        return;
      }
    } else {
      if (!aliasTarget.trim()) {
        setError('Please specify an Alias target endpoint.');
        return;
      }
    }

    const routingConfig: Record<string, any> = {};
    if (routingPolicy === 'WEIGHTED') {
      routingConfig.weight = Number(weight);
      routingConfig.set_id = recordSetId || 'WeightedSet';
    } else if (routingPolicy === 'LATENCY') {
      routingConfig.region = selectedRegion.split(' ')[0];
      routingConfig.set_id = recordSetId || 'LatencySet';
    } else if (routingPolicy === 'FAILOVER') {
      routingConfig.failover_role = failoverRole;
      routingConfig.set_id = recordSetId || `${failoverRole}Endpoint`;
    } else if (routingPolicy === 'GEOLOCATION') {
      routingConfig.geo_location = geoLocation;
      routingConfig.set_id = recordSetId || 'GeoSet';
    } else if (routingPolicy === 'MULTIVALUE') {
      routingConfig.set_id = recordSetId || 'MultiValueSet';
    }

    // Build full name
    const zoneClean = zone.name.endsWith('.') ? zone.name : `${zone.name}.`;
    const cleanSub = subdomain.trim();
    const fullName = cleanSub ? `${cleanSub}.${zoneClean}` : zoneClean;

    setLoading(true);
    try {
      await onCreate({
        name: fullName,
        type: recordType,
        ttl: isAlias ? undefined : Number(ttl),
        values: parsedValues,
        routing_policy: routingPolicy,
        routing_config: routingConfig,
        is_alias: isAlias,
        alias_target: isAlias ? aliasTarget.trim() : undefined,
        health_check_id: healthCheckId.trim() || undefined
      });
      // Reset form
      setSubdomain('');
      setRawValues('');
      setIsAlias(false);
      setAliasTarget('');
      setRoutingPolicy('SIMPLE');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create DNS record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AWSModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create record"
      subtitle={`Hosted Zone: ${zone.name} (${zone.id})`}
      maxWidth="2xl"
      footer={
        <>
          <AWSButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AWSButton>
          <AWSButton variant="primary" onClick={handleSubmit} loading={loading}>
            Create records
          </AWSButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Selector */}
        <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-[#121927] border border-gray-200 dark:border-gray-800 rounded-[2px]">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Creation Mode</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`px-3 py-1 text-xs rounded-[2px] font-medium transition ${
                mode === 'quick'
                  ? 'bg-white dark:bg-[#1e293b] text-[#ec7211] font-bold shadow-xs border border-gray-200 dark:border-gray-700'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              Quick create record
            </button>
            <button
              type="button"
              onClick={() => setMode('wizard')}
              className={`px-3 py-1 text-xs rounded-[2px] font-medium transition ${
                mode === 'wizard'
                  ? 'bg-white dark:bg-[#1e293b] text-[#ec7211] font-bold shadow-xs border border-gray-200 dark:border-gray-700'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              Routing policy wizard
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 rounded-[2px]">
            {error}
          </div>
        )}

        {/* Record Name */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Record name
          </label>
          <div className="flex items-stretch">
            <input
              type="text"
              placeholder="e.g. www, api, blog (or leave blank for root domain)"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="grow px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-[2px] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-[#0073bb] focus:border-[#0073bb] font-mono"
            />
            <div className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-r-[2px] text-gray-600 dark:text-gray-400 flex items-center font-mono select-none">
              .{zone.name.replace(/\.$/, '')}
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Leave blank to route traffic to the root zone apex domain ({zone.name}).
          </p>
        </div>

        {/* Record Type */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Record type
          </label>
          <select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value as RecordType)}
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-[#0073bb]"
          >
            {RECORD_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Alias Toggle */}
        <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-[2px]">
          <div>
            <div className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              Alias
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.2 rounded-xs">
                AWS Route53 Feature
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Route traffic to AWS resources such as CloudFront, S3 Website, API Gateway, or another record.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAlias}
              onChange={(e) => setIsAlias(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ec7211]" />
          </label>
        </div>

        {/* Value or Alias Target */}
        {isAlias ? (
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Choose endpoint / Alias Target
            </label>
            <input
              type="text"
              placeholder="e.g. d1234abcd.cloudfront.net, s3-website-us-east-1.amazonaws.com"
              value={aliasTarget}
              onChange={(e) => setAliasTarget(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100 font-mono"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Value (Multi-line) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Value / Route traffic to
              </label>
              <textarea
                rows={4}
                placeholder={currentTypeConfig.placeholder}
                value={rawValues}
                onChange={(e) => setRawValues(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-[#0073bb]"
              />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                Enter each value on a separate line.
              </p>
            </div>

            {/* TTL */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                TTL (seconds)
              </label>
              <select
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-1 focus:ring-[#0073bb]"
              >
                <option value={60}>60 (1 minute)</option>
                <option value={300}>300 (5 minutes - Standard)</option>
                <option value={900}>900 (15 minutes)</option>
                <option value={3600}>3600 (1 hour)</option>
                <option value={86400}>86400 (1 day)</option>
                <option value={172800}>172800 (2 days)</option>
              </select>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                Time to live in resolver cache.
              </p>
            </div>
          </div>
        )}

        {/* Routing Policy (Shown in Wizard or Expandable) */}
        {(mode === 'wizard' || routingPolicy !== 'SIMPLE') && (
          <div className="p-3.5 bg-gray-50 dark:bg-[#121927] border border-gray-200 dark:border-gray-800 rounded-[2px] space-y-3">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#ec7211]" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                Routing Policy Configuration
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Policy
                </label>
                <select
                  value={routingPolicy}
                  onChange={(e) => setRoutingPolicy(e.target.value as RoutingPolicy)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
                >
                  <option value="SIMPLE">Simple routing</option>
                  <option value="WEIGHTED">Weighted routing</option>
                  <option value="LATENCY">Latency-based routing</option>
                  <option value="FAILOVER">Failover routing</option>
                  <option value="GEOLOCATION">Geolocation routing</option>
                  <option value="MULTIVALUE">Multivalue answer routing</option>
                </select>
              </div>

              {routingPolicy === 'WEIGHTED' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Weight (0-255)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
                  />
                </div>
              )}

              {routingPolicy === 'LATENCY' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target AWS Region
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
                  >
                    {AWS_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {routingPolicy === 'FAILOVER' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Failover record type
                  </label>
                  <select
                    value={failoverRole}
                    onChange={(e) => setFailoverRole(e.target.value as 'PRIMARY' | 'SECONDARY')}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
                  >
                    <option value="PRIMARY">Primary (Active)</option>
                    <option value="SECONDARY">Secondary (Standby)</option>
                  </select>
                </div>
              )}

              {routingPolicy === 'GEOLOCATION' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <select
                    value={geoLocation}
                    onChange={(e) => setGeoLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
                  >
                    <option value="Default">Default (Global)</option>
                    <option value="North America">North America</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia">Asia</option>
                    <option value="South America">South America</option>
                    <option value="Australia">Oceania / Australia</option>
                  </select>
                </div>
              )}

              {routingPolicy !== 'SIMPLE' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Record set ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Primary-Endpoint, US-West-Cluster"
                    value={recordSetId}
                    onChange={(e) => setRecordSetId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px]"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </AWSModal>
  );
}
