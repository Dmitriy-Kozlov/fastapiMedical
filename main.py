from fastapi import FastAPI
from routers import patients, appointments, doctors, schedules


app = FastAPI(
    title="Medical"
)

app.include_router(patients.router)
app.include_router(schedules.router)
app.include_router(appointments.router)
app.include_router(doctors.router)
