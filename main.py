from fastapi import FastAPI
from routers import patients, appointments, doctors, schedules, auth, pages
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Medical"
)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(patients.router)
app.include_router(schedules.router)
app.include_router(appointments.router)
app.include_router(doctors.router)
app.include_router(auth.router)
app.include_router(pages.router)
