from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

ALLOWED_RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"]
ALLOWED_ROUTING_POLICIES = ["SIMPLE", "WEIGHTED", "LATENCY", "FAILOVER", "GEOLOCATION", "MULTIVALUE"]

class DNSRecordBase(BaseModel):
    name: str = Field(..., description="Record name (e.g., api.example.com. or example.com.)")
    type: str = Field("A", description="Record type: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA")
    ttl: Optional[int] = Field(300, description="TTL in seconds")
    values: List[str] = Field(default_factory=list, description="Record values / target IP / hostname / text")
    routing_policy: str = Field("SIMPLE", description="SIMPLE, WEIGHTED, LATENCY, FAILOVER, GEOLOCATION, MULTIVALUE")
    routing_config: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_alias: bool = False
    alias_target: Optional[str] = None
    health_check_id: Optional[str] = None

    @field_validator("name")
    def clean_name(cls, v):
        name = v.strip().lower()
        if not name.endswith("."):
            name = f"{name}."
        return name

    @field_validator("type")
    def validate_type(cls, v):
        v_upper = v.strip().upper()
        if v_upper not in ALLOWED_RECORD_TYPES:
            raise ValueError(f"Record type '{v}' is not supported. Must be one of {ALLOWED_RECORD_TYPES}")
        return v_upper

    @field_validator("routing_policy")
    def validate_policy(cls, v):
        v_upper = v.strip().upper()
        if v_upper not in ALLOWED_ROUTING_POLICIES:
            raise ValueError(f"Routing policy '{v}' is not supported. Must be one of {ALLOWED_ROUTING_POLICIES}")
        return v_upper

class DNSRecordCreate(DNSRecordBase):
    pass

class DNSRecordUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    ttl: Optional[int] = None
    values: Optional[List[str]] = None
    routing_policy: Optional[str] = None
    routing_config: Optional[Dict[str, Any]] = None
    is_alias: Optional[bool] = None
    alias_target: Optional[str] = None
    health_check_id: Optional[str] = None

class DNSRecordResponse(BaseModel):
    id: str
    hosted_zone_id: str
    name: str
    type: str
    ttl: Optional[int]
    values: List[str]
    routing_policy: str
    routing_config: Dict[str, Any] = {}
    is_alias: bool
    alias_target: Optional[str] = None
    health_check_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DNSRecordListResponse(BaseModel):
    items: List[DNSRecordResponse]
    total: int
    page: int
    page_size: int

class BulkDeleteRecordsRequest(BaseModel):
    record_ids: List[str]

class BulkUpdateTTLRequest(BaseModel):
    record_ids: List[str]
    ttl: int
