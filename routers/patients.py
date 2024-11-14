from fastapi import APIRouter, HTTPException
import schemas
from crud import PatientCRUD

router = APIRouter(
    prefix="/patients",
    tags=["patients"]
)


@router.post("/", response_model=schemas.Patient)
async def create_patient(patient: schemas.PatientCreate):
    patient_db = await PatientCRUD.add(**patient.dict())
    return patient_db


@router.get("/{patient_id}", response_model=schemas.Patient)
async def read_patient(patient_id: int):
    db_patient = await PatientCRUD.find_one_or_none_by_id(id=patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient
