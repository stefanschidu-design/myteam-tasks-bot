from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.types import InlineKeyboardMarkup

STATUS_OPTIONS = [
    ("in_progress", "🔄 In lucru"),
    ("completed", "✅ Finalizata"),
    ("pending", "⏳ In asteptare"),
]

PRIORITY_OPTIONS = [
    ("low", "🟢 Scazuta"),
    ("medium", "🟡 Medie"),
    ("high", "🔴 Inalta"),
]


def task_status_keyboard(task_id: str) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    for value, label in STATUS_OPTIONS:
        kb.button(text=label, callback_data=f"status:{task_id}:{value}")
    kb.adjust(2)
    return kb.as_markup()


def priority_keyboard() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    for value, label in PRIORITY_OPTIONS:
        kb.button(text=label, callback_data=f"priority:{value}")
    kb.adjust(3)
    return kb.as_markup()


def assignee_keyboard(employees: list[dict]) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    for emp in employees:
        kb.button(text=f"👤 {emp['name']}", callback_data=f"assign:{emp['id']}")
    kb.adjust(2)
    return kb.as_markup()


def tasks_list_keyboard(tasks: list[dict]) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    status_emoji = {
        "pending": "⏳",
        "in_progress": "🔄",
        "completed": "✅",
        "overdue": "❌",
    }
    for task in tasks:
        emoji = status_emoji.get(task["status"], "📋")
        deadline = task["deadline"][:10]
        kb.button(
            text=f"{emoji} {task['title']} ({deadline})",
            callback_data=f"task_detail:{task['id']}",
        )
    kb.adjust(1)
    return kb.as_markup()
