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


async def on_startup(bot: Bot, scheduler) -> None:
    try:
        logger.info("on_startup: WEBHOOK_URL=%s", settings.WEBHOOK_URL)
        scheduler.start()
        logger.info("on_startup: scheduler started")
        if not settings.WEBHOOK_URL:
            logger.error("WEBHOOK_URL is not set! Bot cannot receive updates.")
            return
        webhook_url = f"{settings.WEBHOOK_URL}/webhook"
        await bot.set_webhook(url=webhook_url, secret_token=settings.WEBHOOK_SECRET)
        logger.info("Webhook setat la %s", webhook_url)
    except Exception as e:
        logger.error("on_startup FAILED: %s", e, exc_info=True)


async def on_shutdown(bot: Bot) -> None:
    # Do NOT delete webhook on shutdown — Render free tier sleeps/restarts
    # frequently and we want Telegram to queue messages until we wake up
    logger.info("Bot shutting down (webhook preserved).")


async def health_handler(request: web.Request) -> web.Response:
    return web.Response(text="OK")


async def debug_handler(request: web.Request) -> web.Response:
    import json
    info = {
        "webhook_url": settings.WEBHOOK_URL,
        "webhook_url_set": bool(settings.WEBHOOK_URL),
        "bot_token_set": bool(settings.BOT_TOKEN),
        "supabase_url": settings.SUPABASE_URL,
        "supabase_key_set": bool(settings.SUPABASE_SERVICE_KEY),
        "elevenlabs_key_set": bool(settings.ELEVENLABS_API_KEY),
        "manager_id": settings.MANAGER_TELEGRAM_ID,
    }
    return web.Response(text=json.dumps(info, indent=2), content_type="application/json")


def main() -> None:
    bot = Bot(token=settings.BOT_TOKEN.strip())
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
    app.router.add_get("/debug", debug_handler)
    app.on_startup.append(lambda _: on_startup(bot, scheduler))
    app.on_shutdown.append(lambda _: on_shutdown(bot))

    port = int(os.environ.get("PORT", 8000))
    web.run_app(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
