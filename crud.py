# app/crud.py
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from database import async_session_maker
import models


class BaseCRUD:
    model = None

    @classmethod
    async def find_one_or_none_by_id(cls, id: int):
        async with async_session_maker() as session:
            query = select(cls.model).filter_by(id=id)
            result = await session.execute(query)
            plain_result = result.scalar_one_or_none()
            return plain_result

    @classmethod
    async def find_all(cls):
        async with async_session_maker() as session:
            query = select(cls.model)
            result = await session.execute(query)
            plain_result = result.scalars().all()
            return plain_result

    @classmethod
    async def find_by_filter(cls, **filter):
        async with async_session_maker() as session:
            filters = dict(**{k: v for k, v in filter.items() if v is not None})
            query = select(cls.model).filter_by(**filters)
            result = await session.execute(query)
            plain_result = result.scalars().all()
            return plain_result

    @classmethod
    async def add(cls, **values):
        async with async_session_maker() as session:
            async with session.begin():
                new_instance = cls.model(**values)
                session.add(new_instance)
                try:
                    await session.commit()
                except SQLAlchemyError as e:
                    await session.rollback()
                    raise e
                return new_instance


class PatientCRUD(BaseCRUD):
    model = models.Patient


class DoctorCRUD(BaseCRUD):
    model = models.Doctor


class ScheduleCRUD(BaseCRUD):
    model = models.Schedule


class AppointmentCRUD(BaseCRUD):
    model = models.Appointment
