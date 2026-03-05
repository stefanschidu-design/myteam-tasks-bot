from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from bot.services.task_service import get_daily_summary

router = Router()


@router.message(Command("report"))
async def cmd_report(message: Message, db_user: dict):
    if db_user["role"] != "manager":
        await message.answer("❌ Aceasta comanda este disponibila doar managerilor.")
        return

    summaries = await get_daily_summary()
    if not summaries:
        await message.answer("📭 Nu exista date pentru raport.")
        return

    lines = ["📊 <b>Raport echipa</b>\n"]
    for row in summaries:
        rate = row.get("completion_rate") or 0
        lines.append(
            f"👤 <b>{row['user_name']}</b>\n"
            f"   ✅ Finalizate: {row['completed_tasks']}/{row['total_tasks']} ({rate}%)\n"
            f"   🔄 In lucru: {row['in_progress_tasks']}\n"
            f"   ⏳ In asteptare: {row['pending_tasks']}\n"
            f"   ❌ Intarziate: {row['overdue_tasks']}"
        )
    await message.answer("\n\n".join(lines), parse_mode="HTML")
