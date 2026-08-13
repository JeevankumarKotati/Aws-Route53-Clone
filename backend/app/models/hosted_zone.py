import datetime
import random
import string
from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_zone_id() -> str:
    # Generate Route53-like Zone ID (e.g. Z0123456789ABC)
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=14))
    return f"Z{suffix}"

class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String(32), primary_key=True, default=generate_zone_id, index=True)
    name = Column(String(255), nullable=False, index=True)
    caller_reference = Column(String(255), nullable=True)
    comment = Column(Text, nullable=True)
    zone_type = Column(String(32), nullable=False, default="PUBLIC")  # PUBLIC or PRIVATE
    vpc_id = Column(String(64), nullable=True)
    vpc_region = Column(String(64), nullable=True)
    record_count = Column(Integer, default=0)
    tags = Column(Text, default="{}")  # JSON string {"Environment": "Production", "Owner": "DevOps"}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    records = relationship("DNSRecord", back_populates="hosted_zone", cascade="all, delete-orphan")
