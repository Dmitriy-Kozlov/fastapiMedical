from fastapi import APIRouter, HTTPException
import schemas
from crud import DoctorCRUD

router = APIRouter(
    prefix="/api/doctors",
    tags=["doctors"]
)


@router.post("/", response_model=schemas.Doctor)
async def create_doctor(doctor: schemas.DoctorBase):
    doctor_db = await DoctorCRUD.add(**doctor.dict())
    return doctor_db


@router.get("/all", response_model=list[schemas.Doctor])
async def get_all_doctors():
    doctors = await DoctorCRUD.find_all()
    return doctors


@router.post("/filter", response_model=list[schemas.Doctor] | None)
async def get_doctors_by_filter(filters: schemas.DoctorFilter):
    doctors = await DoctorCRUD.find_by_filter(**filters.dict())
    return doctors


@router.get("/{doctor_id}", response_model=schemas.Doctor)
async def read_doctor(doctor_id: int):
    db_doctor = await DoctorCRUD.find_one_or_none_by_id(id=doctor_id)
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="doctor not found")
    return db_doctor
