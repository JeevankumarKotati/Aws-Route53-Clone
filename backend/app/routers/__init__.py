from app.routers.auth import router as auth_router
from app.routers.hosted_zones import router as hosted_zones_router
from app.routers.dns_records import router as dns_records_router
from app.routers.export_import import router as export_import_router
from app.routers.dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "hosted_zones_router",
    "dns_records_router",
    "export_import_router",
    "dashboard_router"
]
