from pydantic import BaseModel, EmailStr
from datetime import date, datetime
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


class ScheduleBase(BaseModel):
    doctor_id: int
    day_of_week: int
    start_time: str
    end_time: str


class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    status: AppointmentStatus = AppointmentStatus.SCHEDULED
    notes: Optional[str]
