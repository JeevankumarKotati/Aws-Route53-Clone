import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.schemas.export_import import ImportBindRequest, ImportBindResponse, ParsedRecordPreview
from app.services.bind_service import parse_bind_zone, export_to_bind_format

router = APIRouter(prefix="/hosted-zones/{zone_id}", tags=["Import / Export"])

@router.post("/import-bind", response_model=ImportBindResponse)
def import_bind_zone(
    zone_id: str,
    payload: ImportBindRequest,
    db: Session = Depends(get_db)
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail=f"Hosted zone '{zone_id}' not found.")

    parsed_records, errors = parse_bind_zone(payload.zone_content, default_origin=zone.name)
    
    imported_count = 0
    skipped_count = 0
    record_previews = []

    for item in parsed_records:
        rec_name = item["name"]
        rec_type = item["type"]
        rec_ttl = item["ttl"]
        rec_values = item["values"]

        # If overwrite is false, check if SOA/NS apex already exist
        if rec_type in ["SOA", "NS"] and rec_name == zone.name and not payload.overwrite_existing:
            skipped_count += 1
            record_previews.append(ParsedRecordPreview(
                name=rec_name,
                type=rec_type,
                ttl=rec_ttl,
                values=rec_values,
                is_valid=True,
                error="Skipped (default apex record already exists)"
            ))
            continue

        existing = db.query(DNSRecord).filter(
            DNSRecord.hosted_zone_id == zone_id,
            DNSRecord.name == rec_name,
            DNSRecord.type == rec_type
        ).first()

        if existing:
            if payload.overwrite_existing:
                existing.values = json.dumps(rec_values)
                existing.ttl = rec_ttl
                imported_count += 1
            else:
                existing_vals = json.loads(existing.values) if existing.values else []
                for v in rec_values:
                    if v not in existing_vals:
                        existing_vals.append(v)
                existing.values = json.dumps(existing_vals)
                imported_count += 1
        else:
            new_rec = DNSRecord(
                hosted_zone_id=zone_id,
                name=rec_name,
                type=rec_type,
                ttl=rec_ttl,
                values=json.dumps(rec_values),
                routing_policy="SIMPLE"
            )
            db.add(new_rec)
            imported_count += 1

        record_previews.append(ParsedRecordPreview(
            name=rec_name,
            type=rec_type,
            ttl=rec_ttl,
            values=rec_values,
            is_valid=True
        ))

    db.flush()
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).count()
    db.commit()

    return ImportBindResponse(
        success=True,
        imported_count=imported_count,
        skipped_count=skipped_count,
        errors=errors,
        records=record_previews
    )

@router.get("/export-bind")
def export_bind_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail=f"Hosted zone '{zone_id}' not found.")

    records = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).all()
    
    rec_dicts = []
    for r in records:
        vals = []
        if r.values:
            try:
                vals = json.loads(r.values)
            except Exception:
                vals = [r.values]
        rec_dicts.append({
            "name": r.name,
            "type": r.type,
            "ttl": r.ttl or 300,
            "values": vals
        })

    bind_content = export_to_bind_format(zone.name, rec_dicts)
    
    filename = f"{zone.name.rstrip('.')}.zone"
    return Response(
        content=bind_content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export-json")
def export_json_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail=f"Hosted zone '{zone_id}' not found.")

    records = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).all()
    
    formatted_records = []
    for r in records:
        vals = []
        if r.values:
            try:
                vals = json.loads(r.values)
            except Exception:
                vals = [r.values]

        routing_cfg = {}
        if r.routing_config:
            try:
                routing_cfg = json.loads(r.routing_config)
            except Exception:
                routing_cfg = {}

        formatted_records.append({
            "Name": r.name,
            "Type": r.type,
            "TTL": r.ttl,
            "ResourceRecords": [{"Value": v} for v in vals],
            "RoutingPolicy": r.routing_policy,
            "RoutingConfig": routing_cfg,
            "AliasTarget": {"DNSName": r.alias_target, "EvaluateTargetHealth": False} if r.is_alias else None
        })

    tags = {}
    if zone.tags:
        try:
            tags = json.loads(zone.tags)
        except Exception:
            tags = {}

    data = {
        "HostedZone": {
            "Id": f"/hostedzone/{zone.id}",
            "Name": zone.name,
            "CallerReference": zone.caller_reference,
            "Config": {
                "Comment": zone.comment,
                "PrivateZone": zone.zone_type == "PRIVATE"
            },
            "ResourceRecordSetCount": len(records),
            "Tags": tags
        },
        "ResourceRecordSets": formatted_records,
        "ExportedAt": datetime.datetime.utcnow().isoformat() + "Z"
    }

    return Response(
        content=json.dumps(data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={zone.name.rstrip('.')}_route53.json"}
    )
