from fastapi import APIRouter, HTTPException
import schemas
from crud import ScheduleCRUD

router = APIRouter(
    prefix="/api/schedules",
    tags=["schedules"]
)


@router.post("/", response_model=schemas.ScheduleBase)
async def create_schedule(schedule: schemas.ScheduleBase):
    schedule_db = await ScheduleCRUD.add(**schedule.dict())
    return schedule_db


@router.get("/all", response_model=list[schemas.ScheduleBase])
async def get_all_schedules():
    schedules = await ScheduleCRUD.find_all()
    return schedules


@router.post("/filter", response_model=list[schemas.ScheduleBase] | None)
async def get_schedules_by_filter(filters: schemas.ScheduleFilter):
    schedules = await ScheduleCRUD.find_by_filter(**filters.dict())
    return schedules


@router.get("/{schedule_id}", response_model=schemas.ScheduleBase)
async def read_schedule(schedule_id: int):
    db_schedule = await ScheduleCRUD.find_one_or_none_by_id(id=schedule_id)
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="schedule not found")
    return db_schedule
