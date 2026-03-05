from aiogram import Router, F
from aiogram.types import CallbackQuery
from bot.services.task_service import update_task_status, get_task_by_id
from bot.keyboards.inline import task_status_keyboard

router = Router()

STATUS_LABELS = {
    "pending": "⏳ In asteptare",
    "in_progress": "🔄 In lucru",
    "completed": "✅ Finalizata",
    "overdue": "❌ Intarziata",
}


@router.callback_query(F.data.startswith("status:"))
async def update_status_callback(callback: CallbackQuery, db_user: dict):
    _, task_id, new_status = callback.data.split(":")
    task = await get_task_by_id(task_id)
    if not task:
        await callback.answer("Sarcina nu a fost gasita.", show_alert=True)
        return

    # Angajatii pot actualiza doar sarcinile lor
    if db_user["role"] != "manager" and task.get("assignee_id") != db_user["id"]:
        await callback.answer("❌ Nu ai permisiunea sa modifici aceasta sarcina.", show_alert=True)
        return

    await update_task_status(task_id, new_status)
    label = STATUS_LABELS[new_status]
    await callback.answer(f"Status actualizat: {label}", show_alert=False)

    # Notifica managerul daca sarcina a fost finalizata
    if new_status == "completed":
        from bot.config import settings
        assignee_name = task.get("assignee", {}).get("name", "—")
        await callback.bot.send_message(
            chat_id=settings.MANAGER_TELEGRAM_ID,
            text=(
                f"✅ Sarcina <b>{task['title']}</b> a fost marcata ca finalizata "
                f"de <b>{assignee_name}</b>."
            ),
            parse_mode="HTML",
        )

    # Actualizeaza keyboard-ul mesajului
    try:
        await callback.message.edit_reply_markup(
            reply_markup=task_status_keyboard(task_id)
        )
    except Exception:
        pass
