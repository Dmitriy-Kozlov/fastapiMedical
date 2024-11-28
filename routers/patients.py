from fastapi import APIRouter, HTTPException, Depends
import schemas
from auth import get_current_user
from crud import PatientCRUD, AppointmentCRUD

router = APIRouter(
    prefix="/api/patients",
    tags=["patients"]
)

#
# @router.post("/", response_model=schemas.Patient)
# async def create_patient(patient: schemas.PatientCreate):
#     patient_db = await PatientCRUD.add(**patient.dict())
#     return patient_db


@router.get("/all", response_model=list[schemas.Patient])
async def get_all_patients():
    patients = await PatientCRUD.find_all()
    return patients


@router.post("/filter", response_model=list[schemas.Patient] | None)
async def get_patients_by_filter(filters: schemas.PatientFilter):
    patients = await PatientCRUD.find_by_filter(**filters.dict())
    return patients


# @router.get("/{patient_id}", response_model=schemas.Patient)
# async def read_patient(patient_id: int):
#     db_patient = await PatientCRUD.find_one_or_none_by_id(id=patient_id)
#     if db_patient is None:
#         raise HTTPException(status_code=404, detail="Patient not found")
#     return db_patient

@router.get("/patient", response_model=schemas.Patient)
async def read_patient(patient=Depends(get_current_user)):
    patient_id = patient.patient_id
    db_patient = await PatientCRUD.find_one_or_none_by_id(id=patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient


@router.post("/patient/appointments", response_model=list[schemas.AppointmentWithDoctorPatient])
async def read_patient_appointments(status: str = None, patient=Depends(get_current_user)):
    patient_id = patient.patient_id
    db_appointments = await AppointmentCRUD.find_appointments_with_doctor_patient(patient_id=patient_id, status=status)
    return db_appointments
