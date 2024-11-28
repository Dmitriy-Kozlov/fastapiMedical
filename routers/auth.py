from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
import schemas
import models
from auth import get_current_user_with_role
from crud import UserCRUD
from typing import Union

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/register", response_model=schemas.UserResponse)
async def register_user(user: schemas.UserCreate):
    db_user = await UserCRUD.find_one_or_none_by_email(email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await UserCRUD.add(user)


@router.post("/login")
async def login_user(form_data: schemas.LoginRequest):
    user = await UserCRUD.find_one_or_none_by_email(email=form_data.username)
    if not user or not models.User.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "patient_id": user.patient_id, "doctor_id": user.doctor_id}


@router.get("/me", response_model=Union[schemas.Patient, schemas.Doctor])
async def get_current_user_data(current_user: Union[schemas.Patient, schemas.Doctor] = Depends(get_current_user_with_role)):
    return current_user
