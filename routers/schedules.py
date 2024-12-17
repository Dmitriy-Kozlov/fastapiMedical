from typing import List

from fastapi import APIRouter, HTTPException, Depends
import schemas
from auth import is_proper_role
from crud import ScheduleCRUD

router = APIRouter(
    prefix="/api/schedules",
    tags=["schedules"]
)


@router.post("/", response_model=list[schemas.ScheduleBase])
async def create_schedule(schedules: list[schemas.ScheduleCreate], user=Depends(is_proper_role([schemas.UserRole.ADMIN]))):
    new_schedules = []
    for schedule_data in schedules:
        schedule_bd = await ScheduleCRUD.add(**schedule_data.dict())
        new_schedules.append(schedule_bd)
    return new_schedules


@router.get("/all", response_model=list[schemas.ScheduleBase])
async def get_all_schedules(user=Depends(is_proper_role([schemas.UserRole.ADMIN, schemas.UserRole.DOCTOR]))):
    schedules = await ScheduleCRUD.find_all()
    return schedules


@router.put("/schedule/edit", response_model=List[schemas.ScheduleBase])
async def update_schedule(schedules: List[schemas.ScheduleBase]):
    updated_schedules = []
    for schedule_data in schedules:
        schedule_bd = await ScheduleCRUD.edit(**schedule_data.dict())
        updated_schedules.append(schedule_bd)
    return updated_schedules


@router.post("/filter", response_model=list[schemas.ScheduleBase] | None)
async def get_schedules_by_filter(filters: schemas.ScheduleFilter,
                                  user=Depends(is_proper_role([schemas.UserRole.ADMIN, schemas.UserRole.DOCTOR]))):
    schedules = await ScheduleCRUD.find_by_filter(**filters.dict())
    return schedules


@router.get("/{schedule_id}", response_model=schemas.ScheduleBase)
async def read_schedule(schedule_id: int):
    db_schedule = await ScheduleCRUD.find_one_or_none_by_id(id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="schedule not found")
    return db_schedule
