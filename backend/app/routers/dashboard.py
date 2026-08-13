from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_zones = db.query(HostedZone).count()
    public_zones = db.query(HostedZone).filter(HostedZone.zone_type == "PUBLIC").count()
    private_zones = db.query(HostedZone).filter(HostedZone.zone_type == "PRIVATE").count()
    total_records = db.query(DNSRecord).count()

    recent_zones = db.query(HostedZone).order_by(HostedZone.created_at.desc()).limit(5).all()

    # Breakdown by record type
    record_type_counts = {}
    for r_type in ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"]:
        cnt = db.query(DNSRecord).filter(DNSRecord.type == r_type).count()
        if cnt > 0:
            record_type_counts[r_type] = cnt

    return {
        "hosted_zones": {
            "total": total_zones,
            "public": public_zones,
            "private": private_zones
        },
        "records": {
            "total": total_records,
            "by_type": record_type_counts
        },
        "health_checks": {
            "total": 5,
            "healthy": 4,
            "unhealthy": 1
        },
        "traffic_policies": {
            "total": 2,
            "active": 2
        },
        "query_volume_24h": "1,429,820 queries",
        "recent_zones": [
            {
                "id": z.id,
                "name": z.name,
                "type": z.zone_type,
                "record_count": z.record_count,
                "created_at": z.created_at
            }
            for z in recent_zones
        ]
    }
