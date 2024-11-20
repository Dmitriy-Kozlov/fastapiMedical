# app/crud.py
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from database import async_session_maker
import models
import schemas


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


class UserCRUD(BaseCRUD):
    model = models.User

    @classmethod
    async def find_one_or_none_by_email(cls, email: str):
        async with async_session_maker() as session:
            query = select(cls.model).filter_by(email=email)
            result = await session.execute(query)
            plain_result = result.scalar_one_or_none()
            return plain_result

    @classmethod
    async def add(cls, user: schemas.UserCreate):
        async with async_session_maker() as session:
            hashed_password = models.User.hash_password(user.password)
            db_user = models.User(
                email=user.email,
                hashed_password=hashed_password,
                role=user.role,
            )
            if user.role == "patient":
                patient = await PatientCRUD.add(
                    first_name=user.first_name,
                    last_name=user.last_name,
                    email=user.email,
                    phone_number=user.phone_number,
                )
                db_user.patient_id = patient.id

            elif user.role == "doctor":
                doctor = await DoctorCRUD.add(
                    first_name=user.first_name,
                    last_name=user.last_name,
                    email=user.email,
                    phone_number=user.phone_number,
                    specialization=user.specialization,
                )
                db_user.doctor_id = doctor.id

            try:
                session.add(db_user)
                await session.commit()
                await session.refresh(db_user)
            except SQLAlchemyError as e:
                await session.rollback()
                raise e
            return db_user
