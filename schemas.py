from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime, time
from enum import Enum
from typing import Optional


class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PatientBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str


class PatientCreate(PatientBase):
    birth_date: Optional[date]


class Patient(PatientBase):
    id: int

    class Config:
        from_attributes = True


class PatientFilter(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    birth_date: Optional[date] = None


class DoctorBase(BaseModel):
    first_name: str
    last_name: str
    specialization: str
    email: EmailStr
    phone_number: str


class Doctor(DoctorBase):
    id: int

    class Config:
        from_attributes = True


class DoctorFilter(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    specialization: Optional[str] = None


class ScheduleBase(BaseModel):
    doctor_id: int
    day_of_week: int = Field(title="Day of week", ge=0, le=6)
    start_time: time
    end_time: time


class ScheduleFilter(BaseModel):
    doctor_id: Optional[int] = None
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None


class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    status: AppointmentStatus = AppointmentStatus.SCHEDULED
    notes: Optional[str]


class AppointmentFilter(BaseModel):
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    appointment_date: Optional[datetime] = None
    status: Optional[AppointmentStatus] = AppointmentStatus.SCHEDULED
    notes: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr
    role: str


class UserCreate(UserBase):
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    specialization: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
