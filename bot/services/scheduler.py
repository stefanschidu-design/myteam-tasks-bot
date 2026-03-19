import logging
import aiohttp
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from aiogram import Bot
from bot.config import settings
from bot.services.task_service import get_overdue_tasks, update_task_status, get_daily_summary

logger = logging.getLogger(__name__)

PRIORITY_EMOJI = {"low": "🟢", "medium": "🟡", "high": "🔴"}


def setup_scheduler(bot: Bot) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="Europe/Bucharest")

    # ─── Self-ping to keep Render free tier alive ─────────────────────────
    @scheduler.scheduled_job(IntervalTrigger(minutes=10))
    async def keep_alive():
        if not settings.WEBHOOK_URL:
            return
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{settings.WEBHOOK_URL}/health", timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    logger.info("Keep-alive ping: %s", resp.status)
        except Exception as e:
            logger.warning("Keep-alive ping failed: %s", e)

    # ─── Re-register webhook every 30 min (in case Telegram dropped it) ──
    @scheduler.scheduled_job(IntervalTrigger(minutes=30))
    async def ensure_webhook():
        if not settings.WEBHOOK_URL:
            return
        try:
            webhook_url = f"{settings.WEBHOOK_URL}/webhook"
            await bot.set_webhook(url=webhook_url, secret_token=settings.WEBHOOK_SECRET)
            logger.info("Webhook re-registered: %s", webhook_url)
        except Exception as e:
            logger.error("Failed to re-register webhook: %s", e)

    @scheduler.scheduled_job(IntervalTrigger(hours=1))
    async def check_overdue():
        tasks = await get_overdue_tasks()
        for task in tasks:
            try:
                await update_task_status(task["id"], "overdue")
                telegram_id = task["assignee"]["telegram_id"]
                deadline_str = task["deadline"][:10]
                await bot.send_message(
                    chat_id=telegram_id,
                    text=(
                        f"⚠️ <b>Sarcina ta a depasit termenul limita!</b>\n\n"
                        f"📋 <b>{task['title']}</b>\n"
                        f"📅 Termen: {deadline_str}\n\n"
                        f"Te rugam sa actualizezi statusul sarcinii."
                    ),
                    parse_mode="HTML",
                )
            except Exception as e:
                logger.error("Eroare la notificarea pentru task %s: %s", task["id"], e)

    @scheduler.scheduled_job(CronTrigger(hour=9, minute=0, timezone="Europe/Bucharest"))
    async def daily_report():
        try:
            summaries = await get_daily_summary()
            if not summaries:
                return
            lines = ["📊 <b>Raport zilnic sarcini</b>\n"]
            for row in summaries:
                rate = row.get("completion_rate") or 0
                lines.append(
                    f"👤 <b>{row['user_name']}</b>\n"
                    f"   ✅ {row['completed_tasks']}/{row['total_tasks']} finalizate ({rate}%)\n"
                    f"   🔄 {row['in_progress_tasks']} in lucru\n"
                    f"   ⚠️ {row['overdue_tasks']} intarziate"
                )
            await bot.send_message(
                chat_id=settings.MANAGER_TELEGRAM_ID,
                text="\n\n".join(lines),
                parse_mode="HTML",
            )
        except Exception as e:
            logger.error("Eroare la raportul zilnic: %s", e)

    return scheduler
