from fastapi import FastAPI, status
from fastapi.responses import RedirectResponse
from routers import patients, appointments, doctors, schedules, auth, pages
from init_superuser import init_superuser

app = FastAPI(
    title="Medical"
)

app.include_router(patients.router)
app.include_router(schedules.router)
app.include_router(appointments.router)
app.include_router(doctors.router)
app.include_router(auth.router)
app.include_router(pages.router)


@app.on_event("startup")
async def startup_event():
    await init_superuser()


@app.get("/")
async def home():
    return RedirectResponse("/pages/login", status_code=status.HTTP_301_MOVED_PERMANENTLY)
