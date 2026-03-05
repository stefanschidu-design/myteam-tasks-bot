import asyncio
import logging
import os
from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from bot.config import settings
from bot.handlers import common, tasks, reports, callbacks
from bot.middlewares.auth import UserRegistrationMiddleware
from bot.services.scheduler import setup_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def on_startup(bot: Bot) -> None:
    webhook_url = f"{settings.WEBHOOK_URL}/webhook"
    await bot.set_webhook(url=webhook_url, secret_token=settings.WEBHOOK_SECRET)
    logger.info("Webhook setat la %s", webhook_url)


async def on_shutdown(bot: Bot) -> None:
    await bot.delete_webhook()
    logger.info("Webhook sters.")


async def health_handler(request: web.Request) -> web.Response:
    return web.Response(text="OK")


def main() -> None:
    bot = Bot(token=settings.BOT_TOKEN)
    dp = Dispatcher()

    # Middleware inregistrat pe toate tipurile de update-uri
    dp.update.middleware(UserRegistrationMiddleware())

    # Routere handlers
    dp.include_router(common.router)
    dp.include_router(tasks.router)
    dp.include_router(reports.router)
    dp.include_router(callbacks.router)

    # Scheduler (overdue check + raport zilnic)
    scheduler = setup_scheduler(bot)
    scheduler.start()

    # Webhook server
    app = web.Application()
    handler = SimpleRequestHandler(
        dispatcher=dp,
        bot=bot,
        secret_token=settings.WEBHOOK_SECRET,
    )
    handler.register(app, path="/webhook")
    setup_application(app, dp, bot=bot)
    app.router.add_get("/health", health_handler)
    app.on_startup.append(lambda _: on_startup(bot))
    app.on_shutdown.append(lambda _: on_shutdown(bot))

    port = int(os.environ.get("PORT", 8000))
    web.run_app(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
