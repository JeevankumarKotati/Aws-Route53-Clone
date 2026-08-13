import json
import random
from sqlalchemy.orm import Session
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.models.user import MockUser

def generate_route53_nameservers() -> list[str]:
    rand_num1 = random.randint(100, 1999)
    rand_num2 = random.randint(10, 99)
    return [
        f"ns-{rand_num1}.awsdns-{rand_num2}.com.",
        f"ns-{rand_num1 + 10}.awsdns-{rand_num2 + 1}.net.",
        f"ns-{rand_num1 + 20}.awsdns-{rand_num2 + 2}.org.",
        f"ns-{rand_num1 + 30}.awsdns-{rand_num2 + 3}.co.uk."
    ]

def create_default_zone_records(hosted_zone: HostedZone, db: Session):
    """
    Automatically provisions default AWS Route53 NS and SOA records for a newly created zone.
    """
    ns_servers = generate_route53_nameservers()
    
    # 1. NS Record
    ns_record = DNSRecord(
        hosted_zone_id=hosted_zone.id,
        name=hosted_zone.name,
        type="NS",
        ttl=172800,
        values=json.dumps(ns_servers),
        routing_policy="SIMPLE",
        routing_config="{}"
    )
    db.add(ns_record)

    # 2. SOA Record
    primary_ns = ns_servers[2] if len(ns_servers) > 2 else "ns-100.awsdns-10.org."
    soa_value = f"{primary_ns} awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
    soa_record = DNSRecord(
        hosted_zone_id=hosted_zone.id,
        name=hosted_zone.name,
        type="SOA",
        ttl=900,
        values=json.dumps([soa_value]),
        routing_policy="SIMPLE",
        routing_config="{}"
    )
    db.add(soa_record)

    hosted_zone.record_count = 2
    db.commit()

def seed_database(db: Session):
    """
    Populates database with initial sample user, hosted zones, and realistic DNS records.
    """
    # 1. Seed Mock User
    user = db.query(MockUser).filter(MockUser.username == "admin").first()
    if not user:
        user = MockUser(
            id="usr_admin_01",
            username="admin",
            role_arn="arn:aws:iam::123456789012:role/AdministratorAccess",
            account_id="123456789012",
            account_alias="production-main",
            region="global"
        )
        db.add(user)
        db.commit()

    # Check if hosted zones exist
    if db.query(HostedZone).count() == 0:
        # Zone 1: example.com (Public)
        zone1 = HostedZone(
            name="example.com.",
            comment="Production domain for main web applications and APIs",
            zone_type="PUBLIC",
            tags=json.dumps({"Environment": "Production", "Project": "CorePlatform", "ManagedBy": "Terraform"})
        )
        db.add(zone1)
        db.flush()
        create_default_zone_records(zone1, db)

        # Add records to example.com
        sample_records_zone1 = [
            DNSRecord(
                hosted_zone_id=zone1.id,
                name="example.com.",
                type="A",
                ttl=300,
                values=json.dumps(["93.184.216.34", "93.184.216.35"]),
                routing_policy="SIMPLE"
            ),
            DNSRecord(
                hosted_zone_id=zone1.id,
                name="www.example.com.",
                type="CNAME",
                ttl=300,
                values=json.dumps(["example.com."]),
                routing_policy="SIMPLE"
            ),
            DNSRecord(
                hosted_zone_id=zone1.id,
                name="api.example.com.",
                type="A",
                ttl=60,
                values=json.dumps(["198.51.100.10"]),
                routing_policy="WEIGHTED",
                routing_config=json.dumps({"weight": 80, "set_id": "PrimaryAPI"})
            ),
            DNSRecord(
                hosted_zone_id=zone1.id,
                name="api.example.com.",
                type="A",
                ttl=60,
                values=json.dumps(["198.51.100.20"]),
                routing_policy="WEIGHTED",
                routing_config=json.dumps({"weight": 20, "set_id": "CanaryAPI"})
            ),
            DNSRecord(
                hosted_zone_id=zone1.id,
                name="example.com.",
                type="MX",
                ttl=3600,
                values=json.dumps(["10 inbound-smtp.us-east-1.amazonaws.com.", "20 inbound-smtp.us-west-2.amazonaws.com."]),
                routing_policy="SIMPLE"
            ),
            DNSRecord(
                hosted_zone_id=zone1.id,
                name="example.com.",
                type="TXT",
                ttl=300,
                values=json.dumps(["v=spf1 include:amazonses.com ~all", "google-site-verification=abc123xyz"]),
                routing_policy="SIMPLE"
            ),
            DNSRecord(
                hosted_zone_id=zone1.id,
                name="_sip._tcp.example.com.",
                type="SRV",
                ttl=300,
                values=json.dumps(["10 60 5060 bigbox.example.com."]),
                routing_policy="SIMPLE"
            ),
            DNSRecord(
                hosted_zone_id=zone1.id,
                name="example.com.",
                type="CAA",
                ttl=3600,
                values=json.dumps(["0 issue \"amazon.com\"", "0 issuewild \";\""]),
                routing_policy="SIMPLE"
            ),
        ]
        for rec in sample_records_zone1:
            db.add(rec)
        zone1.record_count = 2 + len(sample_records_zone1)

        # Zone 2: corp.internal (Private Zone)
        zone2 = HostedZone(
            name="corp.internal.",
            comment="Internal VPC service discovery and internal endpoints",
            zone_type="PRIVATE",
            vpc_id="vpc-0a1b2c3d4e5f6g7h8",
            vpc_region="us-east-1",
            tags=json.dumps({"Environment": "Internal", "VPC": "Prod-VPC-01"})
        )
        db.add(zone2)
        db.flush()
        create_default_zone_records(zone2, db)

        sample_records_zone2 = [
            DNSRecord(
                hosted_zone_id=zone2.id,
                name="db.corp.internal.",
                type="A",
                ttl=60,
                values=json.dumps(["10.0.1.50"]),
                routing_policy="SIMPLE"
            ),
            DNSRecord(
                hosted_zone_id=zone2.id,
                name="auth.corp.internal.",
                type="A",
                ttl=60,
                values=json.dumps(["10.0.2.100"]),
                routing_policy="SIMPLE"
            ),
            DNSRecord(
                hosted_zone_id=zone2.id,
                name="redis.corp.internal.",
                type="CNAME",
                ttl=300,
                values=json.dumps(["master.redis-cluster.internal."]),
                routing_policy="SIMPLE"
            )
        ]
        for rec in sample_records_zone2:
            db.add(rec)
        zone2.record_count = 2 + len(sample_records_zone2)

        # Zone 3: cloud-scaler.org (Public)
        zone3 = HostedZone(
            name="cloud-scaler.org.",
            comment="Community portal and documentation website",
            zone_type="PUBLIC",
            tags=json.dumps({"Team": "DevRel", "CostCenter": "CC-109"})
        )
        db.add(zone3)
        db.flush()
        create_default_zone_records(zone3, db)

        sample_records_zone3 = [
            DNSRecord(
                hosted_zone_id=zone3.id,
                name="cloud-scaler.org.",
                type="A",
                ttl=300,
                values=json.dumps(["104.21.45.92"]),
                is_alias=True,
                alias_target="d2abcxyz.cloudfront.net.",
                routing_policy="SIMPLE"
            ),
            DNSRecord(
                hosted_zone_id=zone3.id,
                name="docs.cloud-scaler.org.",
                type="CNAME",
                ttl=300,
                values=json.dumps(["scaler-docs.gitbook.io."]),
                routing_policy="SIMPLE"
            )
        ]
        for rec in sample_records_zone3:
            db.add(rec)
        zone3.record_count = 2 + len(sample_records_zone3)

        db.commit()
