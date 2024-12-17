import asyncio

from sqlalchemy import select

from crud import UserCRUD  # Импортируем CRUD для пользователей
from models import User
from schemas import UserCreate  # Pydantic-схема для создания пользователя
from database import async_session_maker  # Асинхронная сессия из базы данных


async def init_superuser():
    # Проверьте, существует ли суперпользователь
    async with async_session_maker() as session:
        superuser = await session.execute(
            select(User).filter_by(email="admin@example.com")
        )
        superuser = superuser.scalar_one_or_none()

        if superuser:
            print("Суперпользователь уже существует.")
            return

        # Данные суперпользователя
        superuser_data = UserCreate(
            phone_number="11111",
            first_name="Admin",
            last_name="Admin",
            password="admin123",
            email="admin@example.com",
            role="admin"
        )

        # Создайте суперпользователя
        await UserCRUD.add(superuser_data)
        print("Суперпользователь успешно создан.")


# Запускаем асинхронный код
if __name__ == "__main__":
    asyncio.run(init_superuser())
