import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.schemas.dns_record import (
    DNSRecordCreate,
    DNSRecordUpdate,
    DNSRecordResponse,
    DNSRecordListResponse,
    BulkDeleteRecordsRequest,
    BulkUpdateTTLRequest
)

router = APIRouter(prefix="/hosted-zones/{zone_id}/records", tags=["DNS Records"])

def record_to_response(rec: DNSRecord) -> DNSRecordResponse:
    values_list = []
    if rec.values:
        try:
            values_list = json.loads(rec.values)
        except Exception:
            values_list = [rec.values]

    routing_cfg = {}
    if rec.routing_config:
        try:
            routing_cfg = json.loads(rec.routing_config)
        except Exception:
            routing_cfg = {}

    return DNSRecordResponse(
        id=rec.id,
        hosted_zone_id=rec.hosted_zone_id,
        name=rec.name,
        type=rec.type,
        ttl=rec.ttl,
        values=values_list,
        routing_policy=rec.routing_policy or "SIMPLE",
        routing_config=routing_cfg,
        is_alias=rec.is_alias or False,
        alias_target=rec.alias_target,
        health_check_id=rec.health_check_id,
        created_at=rec.created_at,
        updated_at=rec.updated_at
    )

def validate_and_normalize_name(name: str, zone_name: str) -> str:
    cleaned = name.strip().lower()
    if not cleaned.endswith("."):
        cleaned = f"{cleaned}."
    
    # If name is relative e.g. "api." or "api", append zone name
    if not cleaned.endswith(zone_name):
        if cleaned == "@.":
            cleaned = zone_name
        else:
            cleaned = f"{cleaned.rstrip('.')}.{zone_name}"
    return cleaned

@router.get("", response_model=DNSRecordListResponse)
def list_dns_records(
    zone_id: str,
    query: Optional[str] = Query(None, description="Search record name or value"),
    record_type: Optional[str] = Query(None, description="Filter by record type e.g. A, CNAME"),
    routing_policy: Optional[str] = Query(None, description="Filter by routing policy"),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hosted zone '{zone_id}' not found.")

    db_query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id)

    if query:
        search = f"%{query.strip()}%"
        db_query = db_query.filter(
            or_(
                DNSRecord.name.ilike(search),
                DNSRecord.values.ilike(search),
                DNSRecord.alias_target.ilike(search)
            )
        )

    if record_type and record_type.upper() != "ALL":
        db_query = db_query.filter(DNSRecord.type == record_type.upper())

    if routing_policy and routing_policy.upper() != "ALL":
        db_query = db_query.filter(DNSRecord.routing_policy == routing_policy.upper())

    total = db_query.count()
    records = db_query.order_by(DNSRecord.name.asc(), DNSRecord.type.asc()).offset((page - 1) * page_size).limit(page_size).all()

    return DNSRecordListResponse(
        items=[record_to_response(r) for r in records],
        total=total,
        page=page,
        page_size=page_size
    )

@router.post("", response_model=DNSRecordResponse, status_code=status.HTTP_201_CREATED)
def create_dns_record(zone_id: str, payload: DNSRecordCreate, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hosted zone '{zone_id}' not found.")

    normalized_name = validate_and_normalize_name(payload.name, zone.name)

    # If simple routing policy, check for duplicate name + type combination
    if payload.routing_policy == "SIMPLE":
        existing = db.query(DNSRecord).filter(
            DNSRecord.hosted_zone_id == zone_id,
            DNSRecord.name == normalized_name,
            DNSRecord.type == payload.type,
            DNSRecord.routing_policy == "SIMPLE"
        ).first()
        if existing:
            # For simple records, Route 53 allows appending values to the existing record set
            existing_values = json.loads(existing.values) if existing.values else []
            for v in payload.values:
                if v not in existing_values:
                    existing_values.append(v)
            existing.values = json.dumps(existing_values)
            if payload.ttl:
                existing.ttl = payload.ttl
            db.commit()
            db.refresh(existing)
            return record_to_response(existing)

    record = DNSRecord(
        hosted_zone_id=zone_id,
        name=normalized_name,
        type=payload.type,
        ttl=payload.ttl if not payload.is_alias else None,
        values=json.dumps(payload.values or []),
        routing_policy=payload.routing_policy,
        routing_config=json.dumps(payload.routing_config or {}),
        is_alias=payload.is_alias,
        alias_target=payload.alias_target if payload.is_alias else None,
        health_check_id=payload.health_check_id
    )
    db.add(record)
    db.flush()

    # Update zone record count
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).count()
    db.commit()
    db.refresh(record)

    return record_to_response(record)

@router.get("/{record_id}", response_model=DNSRecordResponse)
def get_dns_record(zone_id: str, record_id: str, db: Session = Depends(get_db)):
    record = db.query(DNSRecord).filter(
        DNSRecord.hosted_zone_id == zone_id,
        DNSRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Record '{record_id}' not found in zone '{zone_id}'.")
    return record_to_response(record)

@router.put("/{record_id}", response_model=DNSRecordResponse)
def update_dns_record(zone_id: str, record_id: str, payload: DNSRecordUpdate, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hosted zone '{zone_id}' not found.")

    record = db.query(DNSRecord).filter(
        DNSRecord.hosted_zone_id == zone_id,
        DNSRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Record '{record_id}' not found in zone '{zone_id}'.")

    if payload.name is not None:
        record.name = validate_and_normalize_name(payload.name, zone.name)
    if payload.type is not None:
        record.type = payload.type.upper()
    if payload.ttl is not None:
        record.ttl = payload.ttl
    if payload.values is not None:
        record.values = json.dumps(payload.values)
    if payload.routing_policy is not None:
        record.routing_policy = payload.routing_policy.upper()
    if payload.routing_config is not None:
        record.routing_config = json.dumps(payload.routing_config)
    if payload.is_alias is not None:
        record.is_alias = payload.is_alias
    if payload.alias_target is not None:
        record.alias_target = payload.alias_target
    if payload.health_check_id is not None:
        record.health_check_id = payload.health_check_id

    db.commit()
    db.refresh(record)
    return record_to_response(record)

@router.delete("/{record_id}", status_code=status.HTTP_200_OK)
def delete_dns_record(zone_id: str, record_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hosted zone '{zone_id}' not found.")

    record = db.query(DNSRecord).filter(
        DNSRecord.hosted_zone_id == zone_id,
        DNSRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Record '{record_id}' not found in zone '{zone_id}'.")

    # Protection: check if deleting apex SOA or NS
    if record.name == zone.name and record.type == "SOA":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The default apex SOA record cannot be deleted as it is required by the DNS standard."
        )

    db.delete(record)
    db.flush()
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).count()
    db.commit()

    return {"message": f"Record '{record_id}' ({record.name} {record.type}) has been deleted."}

@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
def bulk_delete_records(zone_id: str, payload: BulkDeleteRecordsRequest, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hosted zone '{zone_id}' not found.")

    records = db.query(DNSRecord).filter(
        DNSRecord.hosted_zone_id == zone_id,
        DNSRecord.id.in_(payload.record_ids)
    ).all()

    deleted_count = 0
    skipped_soa = False

    for rec in records:
        if rec.name == zone.name and rec.type == "SOA":
            skipped_soa = True
            continue
        db.delete(rec)
        deleted_count += 1

    db.flush()
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).count()
    db.commit()

    msg = f"Successfully deleted {deleted_count} records."
    if skipped_soa:
        msg += " Apex SOA record was protected and retained."
    return {"message": msg, "deleted_count": deleted_count}

@router.post("/bulk-ttl", status_code=status.HTTP_200_OK)
def bulk_update_ttl(zone_id: str, payload: BulkUpdateTTLRequest, db: Session = Depends(get_db)):
    records = db.query(DNSRecord).filter(
        DNSRecord.hosted_zone_id == zone_id,
        DNSRecord.id.in_(payload.record_ids)
    ).all()

    for rec in records:
        if not rec.is_alias:
            rec.ttl = payload.ttl

    db.commit()
    return {"message": f"Updated TTL to {payload.ttl}s for {len(records)} records.", "count": len(records)}
