export type ZoneType = 'PUBLIC' | 'PRIVATE';

export type RecordType = 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'PTR' | 'SRV' | 'CAA' | 'SOA';

export type RoutingPolicy = 'SIMPLE' | 'WEIGHTED' | 'LATENCY' | 'FAILOVER' | 'GEOLOCATION' | 'MULTIVALUE';

export interface HostedZone {
  id: string;
  name: string;
  caller_reference?: string;
  comment?: string;
  zone_type: ZoneType;
  vpc_id?: string;
  vpc_region?: string;
  record_count: number;
  tags: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface HostedZoneListResponse {
  items: HostedZone[];
  total: number;
  page: number;
  page_size: number;
}

export interface DNSRecord {
  id: string;
  hosted_zone_id: string;
  name: string;
  type: RecordType;
  ttl?: number;
  values: string[];
  routing_policy: RoutingPolicy;
  routing_config: Record<string, any>;
  is_alias: boolean;
  alias_target?: string;
  health_check_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DNSRecordListResponse {
  items: DNSRecord[];
  total: number;
  page: number;
  page_size: number;
}

export interface UserProfile {
  username: string;
  role_arn: string;
  account_id: string;
  account_alias: string;
  region: string;
  token: string;
}

export interface DashboardStats {
  hosted_zones: {
    total: number;
    public: number;
    private: number;
  };
  records: {
    total: number;
    by_type: Record<string, number>;
  };
  health_checks: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
  traffic_policies: {
    total: number;
    active: number;
  };
  query_volume_24h: string;
  recent_zones: {
    id: string;
    name: string;
    type: string;
    record_count: number;
    created_at: string;
  }[];
}

export interface ParsedRecordPreview {
  name: string;
  type: string;
  ttl: number;
  values: string[];
  is_valid: boolean;
  error?: string;
}

export interface ImportBindResponse {
  success: boolean;
  imported_count: number;
  skipped_count: number;
  errors: string[];
  records: ParsedRecordPreview[];
}
