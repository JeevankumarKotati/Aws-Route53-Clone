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
    return fetchJson<UserProfile>(`${API_BASE}/auth/me`);
  },

  async login(username: string = 'admin', role: string = 'AdministratorAccess', accountId: string = '123456789012'): Promise<UserProfile> {
    return fetchJson<UserProfile>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, role, account_id: accountId })
    });
  },

  async switchAccount(accountId: string, accountAlias: string, role: string): Promise<UserProfile> {
    return fetchJson<UserProfile>(`${API_BASE}/auth/switch-account`, {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId, account_alias: accountAlias, role })
    });
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchJson<DashboardStats>(`${API_BASE}/dashboard/stats`);
  },

  // Hosted Zones
  async listHostedZones(params: { query?: string; zone_type?: string; page?: number; page_size?: number } = {}): Promise<HostedZoneListResponse> {
    const url = new URL(`${API_BASE}/hosted-zones`);
    if (params.query) url.searchParams.append('query', params.query);
    if (params.zone_type && params.zone_type !== 'ALL') url.searchParams.append('zone_type', params.zone_type);
    if (params.page) url.searchParams.append('page', params.page.toString());
    if (params.page_size) url.searchParams.append('page_size', params.page_size.toString());
    return fetchJson<HostedZoneListResponse>(url.toString());
  },

  async getHostedZone(id: string): Promise<HostedZone> {
    return fetchJson<HostedZone>(`${API_BASE}/hosted-zones/${id}`);
  },

  async createHostedZone(data: {
    name: string;
    comment?: string;
    zone_type: 'PUBLIC' | 'PRIVATE';
    vpc_id?: string;
    vpc_region?: string;
    tags?: Record<string, string>;
  }): Promise<HostedZone> {
    return fetchJson<HostedZone>(`${API_BASE}/hosted-zones`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateHostedZone(id: string, data: { comment?: string; tags?: Record<string, string> }): Promise<HostedZone> {
    return fetchJson<HostedZone>(`${API_BASE}/hosted-zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteHostedZone(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`${API_BASE}/hosted-zones/${id}`, {
      method: 'DELETE'
    });
  },

  // DNS Records
  async listDNSRecords(zoneId: string, params: { query?: string; record_type?: string; routing_policy?: string; page?: number; page_size?: number } = {}): Promise<DNSRecordListResponse> {
    const url = new URL(`${API_BASE}/hosted-zones/${zoneId}/records`);
    if (params.query) url.searchParams.append('query', params.query);
    if (params.record_type && params.record_type !== 'ALL') url.searchParams.append('record_type', params.record_type);
    if (params.routing_policy && params.routing_policy !== 'ALL') url.searchParams.append('routing_policy', params.routing_policy);
    if (params.page) url.searchParams.append('page', params.page.toString());
    if (params.page_size) url.searchParams.append('page_size', params.page_size.toString());
    return fetchJson<DNSRecordListResponse>(url.toString());
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
    return fetchJson<DNSRecord>(`${API_BASE}/hosted-zones/${zoneId}/records`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
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
    return fetchJson<DNSRecord>(`${API_BASE}/hosted-zones/${zoneId}/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteDNSRecord(zoneId: string, recordId: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`${API_BASE}/hosted-zones/${zoneId}/records/${recordId}`, {
      method: 'DELETE'
    });
  },

  async bulkDeleteRecords(zoneId: string, recordIds: string[]): Promise<{ message: string; deleted_count: number }> {
    return fetchJson<{ message: string; deleted_count: number }>(`${API_BASE}/hosted-zones/${zoneId}/records/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ record_ids: recordIds })
    });
  },

  async bulkUpdateTTL(zoneId: string, recordIds: string[], ttl: number): Promise<{ message: string; count: number }> {
    return fetchJson<{ message: string; count: number }>(`${API_BASE}/hosted-zones/${zoneId}/records/bulk-ttl`, {
      method: 'POST',
      body: JSON.stringify({ record_ids: recordIds, ttl })
    });
  },

  // BIND Import & Export
  async importBindZone(zoneId: string, zoneContent: string, overwrite: boolean = false): Promise<ImportBindResponse> {
    return fetchJson<ImportBindResponse>(`${API_BASE}/hosted-zones/${zoneId}/import-bind`, {
      method: 'POST',
      body: JSON.stringify({ zone_content: zoneContent, overwrite_existing: overwrite })
    });
  },

  getExportBindUrl(zoneId: string): string {
    return `${API_BASE}/hosted-zones/${zoneId}/export-bind`;
  },

  getExportJsonUrl(zoneId: string): string {
    return `${API_BASE}/hosted-zones/${zoneId}/export-json`;
  }
};
