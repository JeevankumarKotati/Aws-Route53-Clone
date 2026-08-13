from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import MockUser
from app.schemas.auth import LoginRequest, UserProfile, SwitchAccountRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=UserProfile)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(MockUser).filter(MockUser.username == req.username).first()
    if not user:
        # Auto-create user for demo convenience
        user = MockUser(
            id=f"usr_{req.username}",
            username=req.username,
            role_arn=f"arn:aws:iam::{req.account_id}:role/{req.role}",
            account_id=req.account_id or "123456789012",
            account_alias="production-main",
            region="global"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return UserProfile(
        username=user.username,
        role_arn=user.role_arn,
        account_id=user.account_id,
        account_alias=user.account_alias,
        region=user.region,
        token=f"mock-jwt-token-for-{user.username}"
    )

@router.get("/me", response_model=UserProfile)
def get_current_user(db: Session = Depends(get_db)):
    user = db.query(MockUser).first()
    if not user:
        user = MockUser(
            id="usr_admin",
            username="admin",
            role_arn="arn:aws:iam::123456789012:role/AdministratorAccess",
            account_id="123456789012",
            account_alias="production-main",
            region="global"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return UserProfile(
        username=user.username,
        role_arn=user.role_arn,
        account_id=user.account_id,
        account_alias=user.account_alias,
        region=user.region,
        token=f"mock-jwt-token-for-{user.username}"
    )

@router.post("/switch-account", response_model=UserProfile)
def switch_account(req: SwitchAccountRequest, db: Session = Depends(get_db)):
    user = db.query(MockUser).first()
    if user:
        user.account_id = req.account_id
        user.account_alias = req.account_alias
        user.role_arn = f"arn:aws:iam::{req.account_id}:role/{req.role}"
        db.commit()
        db.refresh(user)

    return UserProfile(
        username=user.username if user else "admin",
        role_arn=user.role_arn if user else f"arn:aws:iam::{req.account_id}:role/{req.role}",
        account_id=req.account_id,
        account_alias=req.account_alias,
        region="global",
        token="mock-jwt-token"
    )

@router.post("/logout")
def logout():
    return {"message": "Successfully logged out from AWS Management Console session."}
