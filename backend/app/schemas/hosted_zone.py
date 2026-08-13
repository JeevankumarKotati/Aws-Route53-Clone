from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime

class HostedZoneBase(BaseModel):
    name: str = Field(..., description="Domain name (e.g., example.com)")
    comment: Optional[str] = Field(None, description="Optional description")
    zone_type: str = Field("PUBLIC", description="PUBLIC or PRIVATE")
    vpc_id: Optional[str] = None
    vpc_region: Optional[str] = None
    tags: Optional[Dict[str, str]] = Field(default_factory=dict)

    @field_validator("name")
    def clean_name(cls, v):
        name = v.strip().lower()
        if not name.endswith("."):
            name = f"{name}."
        return name

class HostedZoneCreate(HostedZoneBase):
    pass

class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None
    tags: Optional[Dict[str, str]] = None

class HostedZoneResponse(BaseModel):
    id: str
    name: str
    caller_reference: Optional[str] = None
    comment: Optional[str] = None
    zone_type: str
    vpc_id: Optional[str] = None
    vpc_region: Optional[str] = None
    record_count: int
    tags: Dict[str, str] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HostedZoneListResponse(BaseModel):
    items: List[HostedZoneResponse]
    total: int
    page: int
    page_size: int
