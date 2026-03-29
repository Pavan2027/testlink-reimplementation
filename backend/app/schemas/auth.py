from pydantic import BaseModel, EmailStr


class OrganizationRegister(BaseModel):
    org_name: str
    org_slug: str          # e.g. "acme-corp" — used in future for subdomain routing
    admin_full_name: str
    admin_email: EmailStr
    admin_password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class TokenPayload(BaseModel):
    sub: str               # user id
    org_id: str            # organization id
    role: str
    must_change_password: bool