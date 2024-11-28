from typing import Optional

from fastapi import APIRouter, HTTPException
import schemas
from crud import AppointmentCRUD
from datetime import datetime, date

router = APIRouter(
    prefix="/api/appointments",
    tags=["appointments"]
)


@router.post("/", response_model=schemas.AppointmentBase)
async def create_appointment(appointment: schemas.AppointmentBase):
    appointment_db = await AppointmentCRUD.add(**appointment.dict())
    return appointment_db


@router.get("/all", response_model=list[schemas.AppointmentBase])
async def get_all_appointments():
    appointments = await AppointmentCRUD.find_all()
    return appointments


@router.post("/filter", response_model=list[schemas.AppointmentBase] | None)
async def get_appointments_by_filter(filters: schemas.AppointmentFilter):
    appointments = await AppointmentCRUD.find_by_filter(**filters.dict())
    return appointments


@router.put("/edit", response_model=schemas.AppointmentBase | None)
async def update_appointments_by_filter(filters: schemas.AppointmentFilter):
    appointment = await AppointmentCRUD.edit(**filters.dict())
    return appointment


@router.get("/{appointment_id}", response_model=schemas.AppointmentBase)
async def read_appointment(appointment_id: int):
    db_appointment = await AppointmentCRUD.find_one_or_none_by_id(id=appointment_id)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="appointment not found")
    return db_appointment
