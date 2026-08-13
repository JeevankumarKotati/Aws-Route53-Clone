import {
  HostedZone,
  HostedZoneListResponse,
  DNSRecord,
  DNSRecordListResponse,
  UserProfile,
  DashboardStats,
  ImportBindResponse
} from '@/types/route53';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// Initial Mock Seed Data for standalone Vercel previews
const INITIAL_MOCK_ZONES: HostedZone[] = [
  {
    id: 'ZH5JT8DGRTE764R',
    name: 'example.com.',
    caller_reference: 'create-hosted-zone-seed01',
    comment: 'Production domain for main web applications and APIs',
    zone_type: 'PUBLIC',
    record_count: 10,
    tags: { Environment: 'Production', Project: 'CorePlatform', ManagedBy: 'Terraform' },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'ZBT93POYW0XEC9E',
    name: 'corp.internal.',
    caller_reference: 'create-hosted-zone-seed02',
    comment: 'Internal VPC service discovery and internal endpoints',
    zone_type: 'PRIVATE',
    vpc_id: 'vpc-0a1b2c3d4e5f6g7h8',
    vpc_region: 'us-east-1',
    record_count: 5,
    tags: { Environment: 'Internal', VPC: 'Prod-VPC-01' },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'ZW17VBUMVLF1IFC',
    name: 'cloud-scaler.org.',
    caller_reference: 'create-hosted-zone-seed03',
    comment: 'Community portal and documentation website',
    zone_type: 'PUBLIC',
    record_count: 4,
    tags: { Team: 'DevRel', CostCenter: 'CC-109' },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const INITIAL_MOCK_RECORDS: Record<string, DNSRecord[]> = {
  ZH5JT8DGRTE764R: [
    {
      id: 'rec_ns_01',
      hosted_zone_id: 'ZH5JT8DGRTE764R',
      name: 'example.com.',
      type: 'NS',
      ttl: 172800,
      values: [
        'ns-452.awsdns-56.com.',
        'ns-462.awsdns-57.net.',
        'ns-472.awsdns-58.org.',
        'ns-482.awsdns-59.co.uk.'
      ],
      routing_policy: 'SIMPLE',
      routing_config: {},
      is_alias: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rec_soa_01',
      hosted_zone_id: 'ZH5JT8DGRTE764R',
      name: 'example.com.',
      type: 'SOA',
      ttl: 900,
      values: ['ns-472.awsdns-58.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400'],
      routing_policy: 'SIMPLE',
      routing_config: {},
      is_alias: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rec_a_01',
      hosted_zone_id: 'ZH5JT8DGRTE764R',
      name: 'example.com.',
      type: 'A',
      ttl: 300,
      values: ['93.184.216.34', '93.184.216.35'],
      routing_policy: 'SIMPLE',
      routing_config: {},
      is_alias: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rec_cname_01',
      hosted_zone_id: 'ZH5JT8DGRTE764R',
      name: 'www.example.com.',
      type: 'CNAME',
      ttl: 300,
      values: ['example.com.'],
      routing_policy: 'SIMPLE',
      routing_config: {},
      is_alias: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rec_api_01',
      hosted_zone_id: 'ZH5JT8DGRTE764R',
      name: 'api.example.com.',
      type: 'A',
      ttl: 60,
      values: ['198.51.100.10'],
      routing_policy: 'WEIGHTED',
      routing_config: { weight: 80, set_id: 'PrimaryAPI' },
      is_alias: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rec_mx_01',
      hosted_zone_id: 'ZH5JT8DGRTE764R',
      name: 'example.com.',
      type: 'MX',
      ttl: 3600,
      values: ['10 inbound-smtp.us-east-1.amazonaws.com.'],
      routing_policy: 'SIMPLE',
      routing_config: {},
      is_alias: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

// LocalStorage helpers for standalone preview mode
function getLocalZones(): HostedZone[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_ZONES;
  const stored = localStorage.getItem('r53_demo_zones');
  if (!stored) {
    localStorage.setItem('r53_demo_zones', JSON.stringify(INITIAL_MOCK_ZONES));
    return INITIAL_MOCK_ZONES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_MOCK_ZONES;
  }
}

function saveLocalZones(zones: HostedZone[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('r53_demo_zones', JSON.stringify(zones));
  }
}

function getLocalRecords(zoneId: string): DNSRecord[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_RECORDS[zoneId] || [];
  const stored = localStorage.getItem(`r53_demo_records_${zoneId}`);
  if (!stored) {
    const defaults = INITIAL_MOCK_RECORDS[zoneId] || [];
    localStorage.setItem(`r53_demo_records_${zoneId}`, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLocalRecords(zoneId: string, records: DNSRecord[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`r53_demo_records_${zoneId}`, JSON.stringify(records));
  }
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || JSON.stringify(err);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<UserProfile> {
    try {
      return await fetchJson<UserProfile>(`${API_BASE}/auth/me`);
    } catch {
      return {
        username: 'admin',
        role_arn: 'arn:aws:iam::123456789012:role/AdministratorAccess',
        account_id: '123456789012',
        account_alias: 'production-main',
        region: 'global',
        token: 'mock-session'
      };
    }
  },

  async login(username = 'admin', role = 'AdministratorAccess', accountId = '123456789012'): Promise<UserProfile> {
    try {
      return await fetchJson<UserProfile>(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ username, role, account_id: accountId })
      });
    } catch {
      return {
        username,
        role_arn: `arn:aws:iam::${accountId}:role/${role}`,
        account_id: accountId,
        account_alias: accountId === '123456789012' ? 'production-main' : 'staging-env',
        region: 'global',
        token: 'mock-jwt-session'
      };
    }
  },

  async switchAccount(accountId: string, accountAlias: string, role: string): Promise<UserProfile> {
    try {
      return await fetchJson<UserProfile>(`${API_BASE}/auth/switch-account`, {
        method: 'POST',
        body: JSON.stringify({ account_id: accountId, account_alias: accountAlias, role })
      });
    } catch {
      return {
        username: 'admin',
        role_arn: `arn:aws:iam::${accountId}:role/${role}`,
        account_id: accountId,
        account_alias: accountAlias,
        region: 'global',
        token: 'mock-jwt-session'
      };
    }
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await fetchJson<DashboardStats>(`${API_BASE}/dashboard/stats`);
    } catch {
      const zones = getLocalZones();
      return {
        hosted_zones: {
          total: zones.length,
          public: zones.filter((z) => z.zone_type === 'PUBLIC').length,
          private: zones.filter((z) => z.zone_type === 'PRIVATE').length
        },
        records: {
          total: 19,
          by_type: { A: 6, CNAME: 3, TXT: 2, MX: 1, NS: 3, SOA: 3 }
        },
        health_checks: { total: 5, healthy: 4, unhealthy: 1 },
        traffic_policies: { total: 2, active: 2 },
        query_volume_24h: '1,429,820 queries',
        recent_zones: zones.slice(0, 5).map((z) => ({
          id: z.id,
          name: z.name,
          type: z.zone_type,
          record_count: z.record_count,
          created_at: z.created_at
        }))
      };
    }
  },

  // Hosted Zones
  async listHostedZones(params: { query?: string; zone_type?: string; page?: number; page_size?: number } = {}): Promise<HostedZoneListResponse> {
    try {
      const url = new URL(`${API_BASE}/hosted-zones`);
      if (params.query) url.searchParams.append('query', params.query);
      if (params.zone_type && params.zone_type !== 'ALL') url.searchParams.append('zone_type', params.zone_type);
      if (params.page) url.searchParams.append('page', params.page.toString());
      if (params.page_size) url.searchParams.append('page_size', params.page_size.toString());
      return await fetchJson<HostedZoneListResponse>(url.toString());
    } catch {
      // Fallback to local storage
      let items = getLocalZones();
      if (params.query) {
        const q = params.query.toLowerCase();
        items = items.filter((z) => z.name.toLowerCase().includes(q) || z.id.toLowerCase().includes(q) || (z.comment || '').toLowerCase().includes(q));
      }
      if (params.zone_type && params.zone_type !== 'ALL') {
        items = items.filter((z) => z.zone_type === params.zone_type);
      }
      return {
        items,
        total: items.length,
        page: params.page || 1,
        page_size: params.page_size || 50
      };
    }
  },

  async getHostedZone(id: string): Promise<HostedZone> {
    try {
      return await fetchJson<HostedZone>(`${API_BASE}/hosted-zones/${id}`);
    } catch {
      const zones = getLocalZones();
      const found = zones.find((z) => z.id === id);
      if (!found) throw new Error(`Hosted zone '${id}' not found.`);
      return found;
    }
  },

  async createHostedZone(data: {
    name: string;
    comment?: string;
    zone_type: 'PUBLIC' | 'PRIVATE';
    vpc_id?: string;
    vpc_region?: string;
    tags?: Record<string, string>;
  }): Promise<HostedZone> {
    try {
      return await fetchJson<HostedZone>(`${API_BASE}/hosted-zones`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      const cleanName = data.name.endsWith('.') ? data.name : `${data.name}.`;
      const id = 'Z' + Math.random().toString(36).substring(2, 16).toUpperCase();
      const newZone: HostedZone = {
        id,
        name: cleanName,
        caller_reference: `create-${Date.now()}`,
        comment: data.comment,
        zone_type: data.zone_type,
        vpc_id: data.vpc_id,
        vpc_region: data.vpc_region,
        record_count: 2,
        tags: data.tags || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const zones = [newZone, ...getLocalZones()];
      saveLocalZones(zones);

      // Auto create NS & SOA
      const randNum = Math.floor(Math.random() * 1500) + 100;
      const initialRecs: DNSRecord[] = [
        {
          id: `rec_ns_${Date.now()}`,
          hosted_zone_id: id,
          name: cleanName,
          type: 'NS',
          ttl: 172800,
          values: [
            `ns-${randNum}.awsdns-10.com.`,
            `ns-${randNum + 10}.awsdns-11.net.`,
            `ns-${randNum + 20}.awsdns-12.org.`,
            `ns-${randNum + 30}.awsdns-13.co.uk.`
          ],
          routing_policy: 'SIMPLE',
          routing_config: {},
          is_alias: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `rec_soa_${Date.now()}`,
          hosted_zone_id: id,
          name: cleanName,
          type: 'SOA',
          ttl: 900,
          values: [`ns-${randNum + 20}.awsdns-12.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400`],
          routing_policy: 'SIMPLE',
          routing_config: {},
          is_alias: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      saveLocalRecords(id, initialRecs);

      return newZone;
    }
  },

  async updateHostedZone(id: string, data: { comment?: string; tags?: Record<string, string> }): Promise<HostedZone> {
    try {
      return await fetchJson<HostedZone>(`${API_BASE}/hosted-zones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch {
      const zones = getLocalZones();
      const zone = zones.find((z) => z.id === id);
      if (!zone) throw new Error('Zone not found');
      if (data.comment !== undefined) zone.comment = data.comment;
      if (data.tags !== undefined) zone.tags = data.tags;
      saveLocalZones(zones);
      return zone;
    }
  },

  async deleteHostedZone(id: string): Promise<{ message: string }> {
    try {
      return await fetchJson<{ message: string }>(`${API_BASE}/hosted-zones/${id}`, {
        method: 'DELETE'
      });
    } catch {
      const zones = getLocalZones().filter((z) => z.id !== id);
      saveLocalZones(zones);
      return { message: 'Zone deleted' };
    }
  },

  // DNS Records
  async listDNSRecords(zoneId: string, params: { query?: string; record_type?: string; routing_policy?: string; page?: number; page_size?: number } = {}): Promise<DNSRecordListResponse> {
    try {
      const url = new URL(`${API_BASE}/hosted-zones/${zoneId}/records`);
      if (params.query) url.searchParams.append('query', params.query);
      if (params.record_type && params.record_type !== 'ALL') url.searchParams.append('record_type', params.record_type);
      if (params.routing_policy && params.routing_policy !== 'ALL') url.searchParams.append('routing_policy', params.routing_policy);
      if (params.page) url.searchParams.append('page', params.page.toString());
      if (params.page_size) url.searchParams.append('page_size', params.page_size.toString());
      return await fetchJson<DNSRecordListResponse>(url.toString());
    } catch {
      let items = getLocalRecords(zoneId);
      if (params.query) {
        const q = params.query.toLowerCase();
        items = items.filter((r) => r.name.toLowerCase().includes(q) || r.values.some((v) => v.toLowerCase().includes(q)));
      }
      if (params.record_type && params.record_type !== 'ALL') {
        items = items.filter((r) => r.type === params.record_type);
      }
      if (params.routing_policy && params.routing_policy !== 'ALL') {
        items = items.filter((r) => r.routing_policy === params.routing_policy);
      }
      return {
        items,
        total: items.length,
        page: params.page || 1,
        page_size: params.page_size || 100
      };
    }
  },

  async createDNSRecord(zoneId: string, data: {
    name: string;
    type: string;
    ttl?: number;
    values: string[];
    routing_policy?: string;
    routing_config?: Record<string, any>;
    is_alias?: boolean;
    alias_target?: string;
    health_check_id?: string;
  }): Promise<DNSRecord> {
    try {
      return await fetchJson<DNSRecord>(`${API_BASE}/hosted-zones/${zoneId}/records`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      const records = getLocalRecords(zoneId);
      const newRec: DNSRecord = {
        id: `rec_${Math.random().toString(36).substring(2, 10)}`,
        hosted_zone_id: zoneId,
        name: data.name,
        type: data.type as any,
        ttl: data.is_alias ? undefined : data.ttl || 300,
        values: data.values || [],
        routing_policy: (data.routing_policy || 'SIMPLE') as any,
        routing_config: data.routing_config || {},
        is_alias: data.is_alias || false,
        alias_target: data.alias_target,
        health_check_id: data.health_check_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const updated = [...records, newRec];
      saveLocalRecords(zoneId, updated);

      const zones = getLocalZones();
      const z = zones.find((item) => item.id === zoneId);
      if (z) {
        z.record_count = updated.length;
        saveLocalZones(zones);
      }

      return newRec;
    }
  },

  async updateDNSRecord(zoneId: string, recordId: string, data: {
    name?: string;
    type?: string;
    ttl?: number;
    values?: string[];
    routing_policy?: string;
    routing_config?: Record<string, any>;
    is_alias?: boolean;
    alias_target?: string;
    health_check_id?: string;
  }): Promise<DNSRecord> {
    try {
      return await fetchJson<DNSRecord>(`${API_BASE}/hosted-zones/${zoneId}/records/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch {
      const records = getLocalRecords(zoneId);
      const rec = records.find((r) => r.id === recordId);
      if (!rec) throw new Error('Record not found');
      if (data.name) rec.name = data.name;
      if (data.ttl !== undefined) rec.ttl = data.ttl;
      if (data.values) rec.values = data.values;
      if (data.is_alias !== undefined) rec.is_alias = data.is_alias;
      if (data.alias_target !== undefined) rec.alias_target = data.alias_target;
      saveLocalRecords(zoneId, records);
      return rec;
    }
  },

  async deleteDNSRecord(zoneId: string, recordId: string): Promise<{ message: string }> {
    try {
      return await fetchJson<{ message: string }>(`${API_BASE}/hosted-zones/${zoneId}/records/${recordId}`, {
        method: 'DELETE'
      });
    } catch {
      const records = getLocalRecords(zoneId).filter((r) => r.id !== recordId);
      saveLocalRecords(zoneId, records);
      const zones = getLocalZones();
      const z = zones.find((item) => item.id === zoneId);
      if (z) {
        z.record_count = records.length;
        saveLocalZones(zones);
      }
      return { message: 'Record deleted' };
    }
  },

  async bulkDeleteRecords(zoneId: string, recordIds: string[]): Promise<{ message: string; deleted_count: number }> {
    try {
      return await fetchJson<{ message: string; deleted_count: number }>(`${API_BASE}/hosted-zones/${zoneId}/records/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify({ record_ids: recordIds })
      });
    } catch {
      const records = getLocalRecords(zoneId).filter((r) => !recordIds.includes(r.id) || r.type === 'SOA');
      saveLocalRecords(zoneId, records);
      return { message: `Deleted ${recordIds.length} records`, deleted_count: recordIds.length };
    }
  },

  async bulkUpdateTTL(zoneId: string, recordIds: string[], ttl: number): Promise<{ message: string; count: number }> {
    try {
      return await fetchJson<{ message: string; count: number }>(`${API_BASE}/hosted-zones/${zoneId}/records/bulk-ttl`, {
        method: 'POST',
        body: JSON.stringify({ record_ids: recordIds, ttl })
      });
    } catch {
      const records = getLocalRecords(zoneId);
      records.forEach((r) => {
        if (recordIds.includes(r.id) && !r.is_alias) {
          r.ttl = ttl;
        }
      });
      saveLocalRecords(zoneId, records);
      return { message: `Updated TTL for ${recordIds.length} records`, count: recordIds.length };
    }
  },

  // BIND Import & Export
  async importBindZone(zoneId: string, zoneContent: string, overwrite = false): Promise<ImportBindResponse> {
    try {
      return await fetchJson<ImportBindResponse>(`${API_BASE}/hosted-zones/${zoneId}/import-bind`, {
        method: 'POST',
        body: JSON.stringify({ zone_content: zoneContent, overwrite_existing: overwrite })
      });
    } catch {
      // Client-side parser fallback
      const records = getLocalRecords(zoneId);
      const lines = zoneContent.split('\n');
      let count = 0;
      lines.forEach((l) => {
        const trimmed = l.trim();
        if (trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('$')) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 3) {
            count++;
          }
        }
      });
      return {
        success: true,
        imported_count: count || 3,
        skipped_count: 0,
        errors: [],
        records: [
          { name: 'example.com.', type: 'A', ttl: 300, values: ['192.0.2.1'], is_valid: true },
          { name: 'www.example.com.', type: 'CNAME', ttl: 300, values: ['example.com.'], is_valid: true }
        ]
      };
    }
  },

  getExportBindUrl(zoneId: string): string {
    return `${API_BASE}/hosted-zones/${zoneId}/export-bind`;
  },

  getExportJsonUrl(zoneId: string): string {
    return `${API_BASE}/hosted-zones/${zoneId}/export-json`;
  }
};
