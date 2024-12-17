from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from crud import UserCRUD, DoctorCRUD, PatientCRUD
from typing import Union
import schemas
import os

SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if not email or not role:
            raise credentials_exception
        return {"email": email, "role": role}
    except JWTError:
        raise credentials_exception


async def get_current_user(token: str = Depends(oauth2_scheme)):
    token_data = decode_token(token)
    user = await UserCRUD.find_one_or_none_by_email(email=token_data.get("email"))
    if user is None:
        raise credentials_exception
    return user


async def get_current_user_with_role(token: str = Depends(oauth2_scheme)) -> Union[schemas.Patient, schemas.Doctor]:
    token_data = decode_token(token)
    user = await UserCRUD.find_one_or_none_by_email(email=token_data.get("email"))
    if user is None:
        raise credentials_exception

    if user.role == "patient" and user.patient_id:
        patient = await PatientCRUD.find_one_or_none_by_id(user.patient_id)
        if not patient:
            raise credentials_exception
        return patient

    elif user.role == "doctor" and user.doctor_id:
        doctor = await DoctorCRUD.find_one_or_none_by_id(user.doctor_id)
        if not doctor:
            raise credentials_exception
        return doctor

    raise HTTPException(status_code=403, detail="Invalid role or associations")


def is_doctor(token: str = Depends(oauth2_scheme)):
    current_user = decode_token(token)
    if current_user.get("role") != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: Only doctors are allowed"
        )
    return current_user


def is_proper_role(allowed_roles: list[str]):
    def dependency(token: str = Depends(oauth2_scheme)):
        current_user = decode_token(token)
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access forbidden: Only for {', '.join(allowed_roles)}"
            )
        return current_user
    return dependency
