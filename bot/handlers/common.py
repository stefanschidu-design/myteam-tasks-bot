from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder
from bot.config import settings

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message, db_user: dict):
    role_label = "manager" if db_user["role"] == "manager" else "angajat"

    markup = None
    if "localhost" not in settings.WEBAPP_URL:
        kb = InlineKeyboardBuilder()
        kb.button(text="📋 Deschide Mini App", web_app=WebAppInfo(url=settings.WEBAPP_URL))
        markup = kb.as_markup()

    await message.answer(
        f"Salut, <b>{db_user['name']}</b>! Esti inregistrat ca <b>{role_label}</b>.\n\n"
        "📌 <b>Comenzi disponibile:</b>\n"
        "/newtask — Creeaza o sarcina noua\n"
        "/mytasks — Sarcinile mele\n"
        "/alltasks — Toate sarcinile <i>(doar manager)</i>\n"
        "/overdue — Sarcini depasite <i>(doar manager)</i>\n"
        "/report — Raport echipa <i>(doar manager)</i>",
        parse_mode="HTML",
        reply_markup=markup,
    )
