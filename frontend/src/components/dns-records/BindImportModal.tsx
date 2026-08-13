'use client';

import React, { useState } from 'react';
import { AWSModal } from '@/components/common/AWSModal';
import { AWSButton } from '@/components/common/AWSButton';
import { HostedZone, ImportBindResponse } from '@/types/route53';
import { api } from '@/lib/api';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface BindImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: HostedZone;
  onSuccess: () => void;
}

export function BindImportModal({
  isOpen,
  onClose,
  zone,
  onSuccess
}: BindImportModalProps) {
  const [zoneContent, setZoneContent] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportBindResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleBind = `; Sample BIND zone file for ${zone.name}
$ORIGIN ${zone.name}
$TTL 300
@       IN  A       192.0.2.1
@       IN  AAAA    2001:db8::1
www     IN  CNAME   ${zone.name}
mail    IN  MX  10  smtp.${zone.name}
txtrec  IN  TXT     "v=spf1 include:_spf.google.com ~all"
`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setZoneContent(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!zoneContent.trim()) {
      setError('Please paste or upload BIND zone file content.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.importBindZone(zone.id, zoneContent, overwrite);
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to import BIND zone.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setZoneContent('');
    setResult(null);
    setError(null);
  };

  return (
    <AWSModal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Import DNS records from BIND zone file"
      subtitle={`Hosted Zone: ${zone.name}`}
      maxWidth="2xl"
      footer={
        result ? (
          <AWSButton variant="primary" onClick={() => { handleReset(); onClose(); }}>
            Done
          </AWSButton>
        ) : (
          <>
            <AWSButton variant="secondary" onClick={() => { handleReset(); onClose(); }} disabled={loading}>
              Cancel
            </AWSButton>
            <AWSButton variant="primary" onClick={handleImport} loading={loading}>
              Import records
            </AWSButton>
          </>
        )
      }
    >
      <div className="space-y-4">
        {result ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-[2px] text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-sm">Zone File Successfully Processed</div>
                <div className="mt-1">
                  Imported <span className="font-bold">{result.imported_count}</span> records.
                  {result.skipped_count > 0 && (
                    <span> Skipped {result.skipped_count} existing apex/system records.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Imported Records Preview */}
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-[2px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-[#161e2e] border-b border-gray-200 dark:border-gray-700 font-bold">
                  <tr>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">TTL</th>
                    <th className="py-2 px-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-[11px]">
                  {result.records.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="py-1.5 px-3">{r.name}</td>
                      <td className="py-1.5 px-3 font-bold text-sky-600">{r.type}</td>
                      <td className="py-1.5 px-3">{r.ttl}s</td>
                      <td className="py-1.5 px-3 max-w-xs truncate">{r.values.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 rounded-[2px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* File upload zone */}
            <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 dark:bg-[#121927] border border-dashed border-gray-300 dark:border-gray-700 rounded-[2px]">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-gray-500" />
                <div className="text-xs">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Upload BIND Zone File</span>
                  <p className="text-[11px] text-gray-500">Supports .zone, .txt, RFC 1035 files</p>
                </div>
              </div>
              <label className="cursor-pointer">
                <span className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-[#1e293b] border border-gray-300 dark:border-gray-600 rounded-[2px] hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-xs inline-block">
                  Browse file
                </span>
                <input
                  type="file"
                  accept=".zone,.txt,.bind"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Paste Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Or paste BIND Zone File contents:
                </label>
                <button
                  type="button"
                  onClick={() => setZoneContent(sampleBind)}
                  className="text-xs text-[#0073bb] dark:text-[#539fe5] hover:underline"
                >
                  Insert sample BIND template
                </button>
              </div>
              <textarea
                rows={8}
                value={zoneContent}
                onChange={(e) => setZoneContent(e.target.value)}
                placeholder="; Paste RFC 1035 zone file content here..."
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#0f172a] border border-gray-300 dark:border-gray-600 rounded-[2px] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#0073bb]"
              />
            </div>

            {/* Overwrite option */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="overwrite_check"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="accent-[#ec7211]"
              />
              <label htmlFor="overwrite_check" className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                Overwrite existing records with matching name and type (Apex SOA will remain protected)
              </label>
            </div>
          </>
        )}
      </div>
    </AWSModal>
  );
}
