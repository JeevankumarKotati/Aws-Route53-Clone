from pydantic import BaseModel
from typing import Optional, List

class LoginRequest(BaseModel):
    username: str = "admin"
    password: Optional[str] = "password"
    account_id: Optional[str] = "123456789012"
    role: Optional[str] = "AdministratorAccess"

class UserProfile(BaseModel):
    username: str
    role_arn: str
    account_id: str
    account_alias: str
    region: str = "global"
    token: str

class SwitchAccountRequest(BaseModel):
    account_id: str
    account_alias: str
    role: str
