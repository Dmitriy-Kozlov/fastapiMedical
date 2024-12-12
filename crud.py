# app/crud.py
from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload
from datetime import datetime, timezone, timedelta, date
from database import async_session_maker
import models
import schemas


DAYS_OF_WEEK = {
    0: "Понедельник",
    1: "Вторник",
    2: "Среда",
    3: "Четверг",
    4: "Пятница",
    5: "Суббота",
    6: "Воскресенье",
}


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
            date_filter = filter.pop("input_date", None)
            last_name_filter = filter.pop("last_name", None)
            query = select(cls.model)
            if filter:
                query = query.filter_by(**{k: v for k, v in filter.items() if v is not None})
            if date_filter:
                query = query.filter(func.date(cls.model.appointment_date) == date_filter)
            if last_name_filter:
                query = query.filter(cls.model.last_name.ilike(f"%{last_name_filter}%"))
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

    @classmethod
    async def edit(cls, **values):
        async with async_session_maker() as session:
            async with session.begin():
                id = values.get("id", None)
                if not id:
                    raise HTTPException(status_code=404, detail="Id not found")
                query = select(cls.model).filter_by(id=id)
                result = await session.execute(query)
                plain_result = result.scalar_one_or_none()
                if not plain_result:
                    raise HTTPException(status_code=404, detail="Object not found")
                for key, value in values.items():
                    if value is not None and hasattr(plain_result, key):
                        setattr(plain_result, key, value)
                try:
                    await session.commit()
                except SQLAlchemyError as e:
                    await session.rollback()
                    raise e
                return plain_result


class PatientCRUD(BaseCRUD):
    model = models.Patient


class AdminCRUD(BaseCRUD):
    model = models.Admin


class DoctorCRUD(BaseCRUD):
    model = models.Doctor

    @classmethod
    async def get_all_doctors_with_schedules(cls):
        async with async_session_maker() as session:
            query = await session.execute(
                select(cls.model).options(
                    joinedload(cls.model.schedules)
                    # cls.model.schedules
                )
            )
            doctors = query.unique().scalars().all()
            result = []
            for doctor in doctors:
                schedule = {}
                for sch in doctor.schedules:
                    start_time = sch.start_time.strftime("%H:%M")
                    end_time = sch.end_time.strftime("%H:%M")
                    schedule[DAYS_OF_WEEK[sch.day_of_week]] = f"{start_time} - {end_time}"
                # result.append({
                #     "id": doctor.id,
                #     "name": f"{doctor.last_name} {doctor.first_name}",
                #     "specialty": doctor.specialization,
                #     "schedule": schedule,
                # })
                result.append({
                    "id": doctor.id,
                    "last_name": doctor.last_name,
                    "first_name": doctor.first_name,
                    "specialization": doctor.specialization,
                    "email": doctor.email,
                    "phone_number": doctor.phone_number,
                    "schedule": schedule,
                })
            print(result)
            return result


class ScheduleCRUD(BaseCRUD):
    model = models.Schedule


class AppointmentCRUD(BaseCRUD):
    model = models.Appointment

    @classmethod
    async def add(cls, patient_id, doctor_id, appointment_date, notes, status):
        invalid_params = {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_date": appointment_date,
            "notes": notes,
            "status": status,
        }
        missing_params = [param for param, value in invalid_params.items() if value is None]

        if missing_params:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required parameters: {', '.join(missing_params)}"
            )
        appointment = await cls.find_by_filter(doctor_id=doctor_id, appointment_date=appointment_date)
        if appointment:
            raise HTTPException(
                status_code=400,
                detail=f"Appointment for date: {appointment_date} already exists"
            )
        async with async_session_maker() as session:
            async with session.begin():
                new_appointment = cls.model(
                    patient_id=patient_id,
                    doctor_id=doctor_id,
                    appointment_date=appointment_date,
                    status="scheduled",
                    notes=notes
                )
                session.add(new_appointment)
                try:
                    await session.commit()
                except SQLAlchemyError as e:
                    await session.rollback()
                    raise e
                return new_appointment

    @classmethod
    async def find_appointments_with_doctor_patient(cls, patient_id: int, status: str = None):
        async with async_session_maker() as session:
            query = select(cls.model).filter_by(patient_id=patient_id)
            if status:
                query = query.filter_by(status=status)
            query = query.options(
                    joinedload(cls.model.doctor),
                    joinedload(cls.model.patient)
                )
            result = await session.execute(query)
            appointments = result.scalars().all()
            return [
                schemas.AppointmentWithDoctorPatient(
                    id=appointment.id,
                    patient_id=appointment.patient_id,
                    doctor_id=appointment.doctor_id,
                    appointment_date=appointment.appointment_date,
                    status=appointment.status,
                    notes=appointment.notes,
                    doctor=appointment.doctor,
                    patient=appointment.patient
                )
                for appointment in appointments
            ]

    @classmethod
    async def find_appointments_with_patient_by_date(cls, doctor_id: int, input_date: date):
        async with async_session_maker() as session:
            query = select(cls.model).filter_by(doctor_id=doctor_id)
            query = query.filter(func.date(cls.model.appointment_date) == input_date)
            query = query.options(
                joinedload(cls.model.patient)
            )
            result = await session.execute(query)
            appointments = result.scalars().all()
            return [
                schemas.AppointmentWithPatient(
                    id=appointment.id,
                    patient_id=appointment.patient_id,
                    doctor_id=appointment.doctor_id,
                    appointment_date=appointment.appointment_date,
                    status=appointment.status,
                    notes=appointment.notes,
                    patient=appointment.patient
                )
                for appointment in appointments
            ]


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

            elif user.role == "admin":
                admin = await AdminCRUD.add(
                    first_name=user.first_name,
                    last_name=user.last_name,
                    email=user.email,
                    phone_number=user.phone_number,
                )
                db_user.admin_id = admin.id

            try:
                session.add(db_user)
                await session.commit()
                await session.refresh(db_user)
            except SQLAlchemyError as e:
                await session.rollback()
                raise e
            return db_user
