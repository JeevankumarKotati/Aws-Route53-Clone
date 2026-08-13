from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ImportBindRequest(BaseModel):
    zone_content: str = Field(..., description="Raw text of the BIND zone file")
    origin_override: Optional[str] = None
    overwrite_existing: bool = False

class ParsedRecordPreview(BaseModel):
    name: str
    type: str
    ttl: int
    values: List[str]
    is_valid: bool = True
    error: Optional[str] = None

class ImportBindResponse(BaseModel):
    success: bool
    imported_count: int
    skipped_count: int
    errors: List[str] = []
    records: List[ParsedRecordPreview] = []

class ExportJsonResponse(BaseModel):
    hosted_zone: Dict[str, Any]
    records: List[Dict[str, Any]]
    exported_at: str
