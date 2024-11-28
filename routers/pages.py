from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates

from auth import get_current_user

router = APIRouter(prefix='/pages', tags=['Фронтенд'])
templates = Jinja2Templates(directory='templates')


@router.get('/login')
async def get_login_html(request: Request):
    return templates.TemplateResponse(name='login.html', context={'request': request})


@router.get('/lk')
async def get_patient_lk_html(request: Request):
    return templates.TemplateResponse(name='patient_lk.html', context={'request': request})


@router.get('/schedule')
async def get_schedule_html(request: Request):
    return templates.TemplateResponse(name='schedule.html', context={'request': request})