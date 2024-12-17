from fastapi import APIRouter, HTTPException, Depends
import schemas
from auth import get_current_user
from crud import AppointmentCRUD
from auth import is_proper_role


router = APIRouter(
    prefix="/api/appointments",
    tags=["appointments"]
)


@router.post("/", response_model=schemas.AppointmentBase)
async def create_appointment(appointment: schemas.AppointmentCreate, user=Depends(get_current_user)):
    appointment_db = await AppointmentCRUD.add(**appointment.dict())
    return appointment_db


@router.get("/all", response_model=list[schemas.AppointmentBase])
async def get_all_appointments(user=Depends(is_proper_role([schemas.UserRole.ADMIN, schemas.UserRole.DOCTOR]))):
    appointments = await AppointmentCRUD.find_all()
    return appointments


@router.post("/filter", response_model=list[schemas.AppointmentBase] | None)
async def get_appointments_by_filter(filters: schemas.AppointmentFilter, user=Depends(get_current_user)):
    appointments = await AppointmentCRUD.find_by_filter(**filters.dict())
    return appointments


@router.put("/edit", response_model=schemas.AppointmentBase | None)
async def update_appointments_by_filter(filters: schemas.AppointmentFilter,
                                        user=Depends(is_proper_role([schemas.UserRole.ADMIN, schemas.UserRole.DOCTOR]))):
    appointment = await AppointmentCRUD.edit(**filters.dict())
    return appointment


@router.get("/{appointment_id}", response_model=schemas.AppointmentBase)
async def read_appointment(appointment_id: int, user=Depends(get_current_user)):
    db_appointment = await AppointmentCRUD.find_one_or_none_by_id(id=appointment_id)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="appointment not found")
    return db_appointment
