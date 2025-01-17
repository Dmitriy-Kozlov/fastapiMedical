from fastapi import APIRouter, HTTPException, Depends

import schemas
from auth import get_current_user, is_proper_role
from crud import PatientCRUD, AppointmentCRUD, UserCRUD

router = APIRouter(
    prefix="/api/patients",
    tags=["patients"]
)


@router.get("/all", response_model=list[schemas.Patient])
async def get_all_patients(user=Depends(is_proper_role(["admin", "doctor"]))):
    patients = await PatientCRUD.find_all()
    return patients


@router.post("/filter", response_model=list[schemas.Patient] | None)
async def get_patients_by_filter(filters: schemas.PatientFilter,
                                 user=Depends(is_proper_role([schemas.UserRole.ADMIN, schemas.UserRole.DOCTOR]))):
    patients = await PatientCRUD.find_by_filter(**filters.dict())
    return patients


@router.get("/patient", response_model=schemas.Patient)
async def read_patient(patient=Depends(get_current_user), user=Depends(is_proper_role([schemas.UserRole.PATIENT]))):
    patient_id = patient.patient_id
    db_patient = await PatientCRUD.find_one_or_none_by_id(id=patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient


@router.put("/patient/edit", response_model=schemas.Patient | None)
async def update_patient_by_filter(filters: schemas.PatientFilter, patient=Depends(get_current_user)):
    patient_bd = await PatientCRUD.edit(**filters.dict())
    user_bd = await UserCRUD.find_by_filter(patient_id=patient_bd.id)
    new_user = await UserCRUD.edit(id=user_bd[0].id, email=patient_bd.email)
    return patient_bd


@router.post("/patient/appointments", response_model=list[schemas.AppointmentWithDoctorPatient])
async def read_patient_appointments(status: str = None, patient_id: schemas.PatientId = None, user=Depends(get_current_user)):
    patient_id = user.patient_id if user.patient_id else patient_id.patient_id
    db_appointments = await AppointmentCRUD.find_appointments_with_doctor_patient(patient_id=patient_id, status=status)
    return db_appointments


@router.get("/{patient_id}", response_model=schemas.Patient)
async def read_patient(patient_id: int):
    db_patient = await PatientCRUD.find_one_or_none_by_id(id=patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient


@router.delete("/{patient_id}/delete")
async def delete_patient(patient_id: int, user=Depends(is_proper_role([schemas.UserRole.ADMIN]))):
    message = await PatientCRUD.delete(id=patient_id)
    return message
