import json
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.schemas.hosted_zone import (
    HostedZoneCreate,
    HostedZoneUpdate,
    HostedZoneResponse,
    HostedZoneListResponse
)
from app.services.seed_data import create_default_zone_records

router = APIRouter(prefix="/hosted-zones", tags=["Hosted Zones"])

def zone_to_response(zone: HostedZone) -> HostedZoneResponse:
    tags_dict = {}
    if zone.tags:
        try:
            tags_dict = json.loads(zone.tags)
        except Exception:
            tags_dict = {}
    return HostedZoneResponse(
        id=zone.id,
        name=zone.name,
        caller_reference=zone.caller_reference,
        comment=zone.comment,
        zone_type=zone.zone_type,
        vpc_id=zone.vpc_id,
        vpc_region=zone.vpc_region,
        record_count=zone.record_count,
        tags=tags_dict,
        created_at=zone.created_at,
        updated_at=zone.updated_at
    )

@router.get("", response_model=HostedZoneListResponse)
def list_hosted_zones(
    query: Optional[str] = Query(None, description="Search query for name or ID"),
    zone_type: Optional[str] = Query(None, description="Filter by PUBLIC or PRIVATE"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    db_query = db.query(HostedZone)

    if query:
        search = f"%{query.strip()}%"
        db_query = db_query.filter(
            or_(
                HostedZone.name.ilike(search),
                HostedZone.id.ilike(search),
                HostedZone.comment.ilike(search)
            )
        )

    if zone_type and zone_type.upper() in ["PUBLIC", "PRIVATE"]:
        db_query = db_query.filter(HostedZone.zone_type == zone_type.upper())

    total = db_query.count()
    zones = db_query.order_by(HostedZone.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # Recalculate dynamic record counts
    for z in zones:
        actual_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == z.id).count()
        if z.record_count != actual_count:
            z.record_count = actual_count
    db.commit()

    return HostedZoneListResponse(
        items=[zone_to_response(z) for z in zones],
        total=total,
        page=page,
        page_size=page_size
    )

@router.post("", response_model=HostedZoneResponse, status_code=status.HTTP_201_CREATED)
def create_hosted_zone(payload: HostedZoneCreate, db: Session = Depends(get_db)):
    # Check if a zone with same name and type already exists
    existing = db.query(HostedZone).filter(
        HostedZone.name == payload.name,
        HostedZone.zone_type == payload.zone_type
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A hosted zone with name '{payload.name}' and type '{payload.zone_type}' already exists with ID '{existing.id}'."
        )

    zone = HostedZone(
        name=payload.name,
        caller_reference=f"create-hosted-zone-{uuid.uuid4().hex[:10]}",
        comment=payload.comment,
        zone_type=payload.zone_type,
        vpc_id=payload.vpc_id,
        vpc_region=payload.vpc_region,
        tags=json.dumps(payload.tags or {})
    )
    db.add(zone)
    db.flush()

    # Automatically generate Route53 authoritative NS and SOA records
    create_default_zone_records(zone, db)

    db.refresh(zone)
    return zone_to_response(zone)

@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_hosted_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hosted zone '{zone_id}' not found.")
    
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count()
    db.commit()
    return zone_to_response(zone)

@router.put("/{zone_id}", response_model=HostedZoneResponse)
def update_hosted_zone(zone_id: str, payload: HostedZoneUpdate, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hosted zone '{zone_id}' not found.")

    if payload.comment is not None:
        zone.comment = payload.comment
    if payload.tags is not None:
        zone.tags = json.dumps(payload.tags)

    db.commit()
    db.refresh(zone)
    return zone_to_response(zone)

@router.delete("/{zone_id}", status_code=status.HTTP_200_OK)
def delete_hosted_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hosted zone '{zone_id}' not found.")

    zone_name = zone.name
    # Delete zone and cascading records
    db.delete(zone)
    db.commit()

    return {"message": f"Hosted zone '{zone_id}' ({zone_name}) has been successfully deleted."}
