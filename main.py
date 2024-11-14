from fastapi import FastAPI
from routers import patients


app = FastAPI(
    title="Medical"
)

app.include_router(patients.router, prefix="/api")
