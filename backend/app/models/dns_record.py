import datetime
import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_record_id() -> str:
    return f"rec_{uuid.uuid4().hex[:12]}"

class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String(32), primary_key=True, default=generate_record_id, index=True)
    hosted_zone_id = Column(String(32), ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)  # e.g. "api.example.com."
    type = Column(String(16), nullable=False, index=True)  # A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA
    ttl = Column(Integer, default=300)
    values = Column(Text, nullable=False)  # JSON string array e.g. '["192.0.2.1", "192.0.2.2"]'
    routing_policy = Column(String(32), default="SIMPLE")  # SIMPLE, WEIGHTED, LATENCY, FAILOVER, GEOLOCATION, MULTIVALUE
    routing_config = Column(Text, default="{}")  # JSON string e.g. '{"weight": 100, "region": "us-east-1", "set_id": "Primary"}'
    is_alias = Column(Boolean, default=False)
    alias_target = Column(String(255), nullable=True)  # e.g. "d1234abcd.cloudfront.net."
    health_check_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    hosted_zone = relationship("HostedZone", back_populates="records")
