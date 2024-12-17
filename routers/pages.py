from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates

router = APIRouter(prefix='/pages', tags=['Фронтенд'])
templates = Jinja2Templates(directory='templates')


@router.get('/')
async def get_index_html(request: Request):
    return templates.TemplateResponse(name='base.html', context={'request': request})


@router.get('/login')
async def get_login_html(request: Request):
    return templates.TemplateResponse(name='login.html', context={'request': request})


@router.get('/lk')
async def get_patient_lk_html(request: Request):
    return templates.TemplateResponse(name='patient_lk.html', context={'request': request})


@router.get('/doctorlk')
async def get_doctor_lk_html(request: Request):
    return templates.TemplateResponse(name='doctor_lk.html', context={'request': request})


@router.get('/adminlk')
async def get_admin_lk_html(request: Request):
    return templates.TemplateResponse(name='admin_lk.html', context={'request': request})


@router.get('/schedule')
async def get_schedule_html(request: Request):
    return templates.TemplateResponse(name='schedule.html', context={'request': request})