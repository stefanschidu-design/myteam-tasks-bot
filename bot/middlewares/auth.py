import logging
from typing import Any, Awaitable, Callable
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Update
from bot.services.user_service import get_or_create_user

logger = logging.getLogger(__name__)


class UserRegistrationMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        tg_user = None

        if hasattr(event, "message") and event.message:
            tg_user = event.message.from_user
        elif hasattr(event, "callback_query") and event.callback_query:
            tg_user = event.callback_query.from_user

        if tg_user:
            try:
                user = await get_or_create_user(
                    telegram_id=tg_user.id,
                    name=tg_user.full_name,
                    username=tg_user.username,
                )
                data["db_user"] = user
            except Exception as e:
                logger.error("Failed to get/create user %s: %s", tg_user.id, e, exc_info=True)
                if hasattr(event, "message") and event.message:
                    await event.message.answer("⚠️ Eroare temporara. Incearca din nou.")
                return

        return await handler(event, data)
