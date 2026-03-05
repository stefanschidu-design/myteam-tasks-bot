"""
Script pentru rulare locala cu polling (fara webhook).
Foloseste: python run_local.py
"""
import asyncio
import logging
from aiogram import Bot, Dispatcher
from bot.config import settings
from bot.handlers import common, tasks, reports, callbacks
from bot.middlewares.auth import UserRegistrationMiddleware
from bot.services.scheduler import setup_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def main():
    bot = Bot(token=settings.BOT_TOKEN)
    dp = Dispatcher()

    dp.update.middleware(UserRegistrationMiddleware())

    dp.include_router(common.router)
    dp.include_router(tasks.router)
    dp.include_router(reports.router)
    dp.include_router(callbacks.router)

    scheduler = setup_scheduler(bot)
    scheduler.start()

    # Sterge webhook-ul existent (daca exista) si porneste polling
    await bot.delete_webhook(drop_pending_updates=True)
    logger.info("Bot pornit in mod polling. Apasa Ctrl+C pentru a opri.")

    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
