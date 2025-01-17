from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user, is_proper_role
from crud import DoctorCRUD, AppointmentCRUD, UserCRUD
import schemas
from datetime import date


router = APIRouter(
    prefix="/api/doctors",
    tags=["doctors"],
)


@router.get("/all", response_model=list[schemas.Doctor])
async def get_all_doctors(user=Depends(get_current_user)):
    doctors = await DoctorCRUD.find_all()
    return doctors


@router.get("/all_with_schedule")
async def get_all_doctors_with_schedule(user=Depends(get_current_user)):
    doctors = await DoctorCRUD.get_all_doctors_with_schedules()
    return doctors


@router.post("/filter", response_model=list[schemas.Doctor] | None)
async def get_doctors_by_filter(filters: schemas.DoctorFilter, user=Depends(get_current_user)):
    doctors = await DoctorCRUD.find_by_filter(**filters.dict())
    return doctors


@router.get("/doctor", response_model=schemas.Doctor)
async def read_doctor(user=Depends(get_current_user),
                      user2=Depends(is_proper_role([schemas.UserRole.ADMIN, schemas.UserRole.DOCTOR]))):
    doctor_id = user.doctor_id
    db_doctor = await DoctorCRUD.find_one_or_none_by_id(id=doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="doctor not found")
    return db_doctor


@router.put("/doctor/edit", response_model=schemas.Doctor | None)
async def update_patient_by_filter(filters: schemas.DoctorFilter, doctor=Depends(get_current_user)):
    doctor_bd = await DoctorCRUD.edit(**filters.dict())
    user_bd = await UserCRUD.find_by_filter(patient_id=doctor_bd.id)
    new_user = await UserCRUD.edit(id=user_bd[0].id, email=doctor_bd.email)
    return doctor_bd


@router.post("/doctor/appointments", response_model=list[schemas.AppointmentWithPatient])
async def read_doctor_appointments(input_date: date, doctor=Depends(get_current_user),
                                   user=Depends(is_proper_role([schemas.UserRole.ADMIN, schemas.UserRole.DOCTOR]))):
    doctor_id = doctor.doctor_id
    db_appointments = await AppointmentCRUD.find_appointments_with_patient_by_date(doctor_id=doctor_id, input_date=input_date)
    return db_appointments


@router.get("/{doctor_id}", response_model=schemas.Doctor)
async def read_doctor_by_id(doctor_id: int,
                            user=Depends(is_proper_role([schemas.UserRole.ADMIN, schemas.UserRole.DOCTOR]))):
    db_doctor = await DoctorCRUD.find_one_or_none_by_id(id=doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="doctor not found")
    return db_doctor


@router.delete("/{doctor_id}/delete")
async def delete_doctor(doctor_id: int, user=Depends(is_proper_role([schemas.UserRole.ADMIN]))):
    message = await DoctorCRUD.delete(id=doctor_id)
    return message
