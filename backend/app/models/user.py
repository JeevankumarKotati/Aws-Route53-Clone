import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.core.database import Base

class MockUser(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False)
    role_arn = Column(String(255), default="arn:aws:iam::123456789012:role/AdministratorAccess")
    account_id = Column(String(32), default="123456789012")
    account_alias = Column(String(64), default="production-main")
    region = Column(String(32), default="global")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    actor = Column(String(64), nullable=False)
    action = Column(String(64), nullable=False)  # CREATE_ZONE, DELETE_ZONE, CREATE_RECORD, etc.
    resource_type = Column(String(32), nullable=False)
    resource_id = Column(String(64), nullable=False)
    details = Column(Text, default="{}")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
