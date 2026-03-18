from datetime import datetime
from aiogram import Router, F
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import Message, CallbackQuery
from bot.services.task_service import create_task, get_tasks_for_user, get_all_tasks
from bot.services.user_service import get_all_employees, get_user_by_id
from bot.services.elevenlabs import transcribe_voice, is_voice_available
from bot.keyboards.inline import (
    task_status_keyboard,
    priority_keyboard,
    assignee_keyboard,
    tasks_list_keyboard,
)

router = Router()

PRIORITY_LABELS = {"low": "🟢 Scazuta", "medium": "🟡 Medie", "high": "🔴 Inalta"}
STATUS_LABELS = {
    "pending": "⏳ In asteptare",
    "in_progress": "🔄 In lucru",
    "completed": "✅ Finalizata",
    "overdue": "❌ Intarziata",
}


class NewTaskFSM(StatesGroup):
    waiting_title = State()
    waiting_description = State()
    waiting_assignee = State()
    waiting_deadline = State()
    waiting_priority = State()


# ─── voice helpers ────────────────────────────────────────────────────────────

async def _download_voice(message: Message) -> bytes:
    file = await message.bot.get_file(message.voice.file_id)
    buf = await message.bot.download_file(file.file_path)
    return buf.read()


async def _transcribe_and_set_title(message: Message, state: FSMContext) -> bool:
    """Download voice, transcribe, store as title, advance FSM to waiting_description.
    Returns True on success, False on error (error message already sent)."""
    status_msg = await message.answer("🎙 Transcribing...")
    try:
        file_bytes = await _download_voice(message)
        title = await transcribe_voice(file_bytes)
    except Exception:
        await status_msg.delete()
        await message.answer("❌ Transcription error. Please try again or type the title manually.")
        return False

    await status_msg.delete()
    await state.update_data(title=title)
    await state.set_state(NewTaskFSM.waiting_description)

    employees = await get_all_employees()
    if not employees:
        await state.clear()
        await message.answer("⚠️ Nu exista angajati inregistrati inca.")
        return False

    await message.answer(
        f"🎙 Recognized: <b>{title}</b>\n\n"
        f"📄 Introdu <b>descrierea</b> sarcinii:\n<i>(trimite /skip daca nu este necesara)</i>",
        parse_mode="HTML",
    )
    return True


# ─── global voice handler (outside FSM) ──────────────────────────────────────

@router.message(
    F.voice,
    ~StateFilter(NewTaskFSM.waiting_title, NewTaskFSM.waiting_description),
)
async def handle_voice_message(message: Message, state: FSMContext, db_user: dict):
    if db_user["role"] != "manager":
        await message.answer("❌ Doar managerii pot crea sarcini prin mesaj vocal.")
        return
    if not is_voice_available():
        await message.answer("⚠️ Functia vocala nu este configurata. Foloseste /newtask si introdu textul manual.")
        return

    await _transcribe_and_set_title(message, state)


# ─── /newtask ────────────────────────────────────────────────────────────────

@router.message(Command("newtask"))
async def cmd_newtask(message: Message, state: FSMContext, db_user: dict):
    if db_user["role"] != "manager":
        await message.answer("❌ Doar managerii pot crea sarcini.")
        return
    await state.set_state(NewTaskFSM.waiting_title)
    await message.answer("📝 Introdu <b>titlul</b> sarcinii:", parse_mode="HTML")


@router.message(NewTaskFSM.waiting_title, F.voice)
async def process_title_voice(message: Message, state: FSMContext):
    if not is_voice_available():
        await message.answer("⚠️ Functia vocala nu este configurata. Introdu titlul manual:")
        return
    await _transcribe_and_set_title(message, state)


@router.message(NewTaskFSM.waiting_title)
async def process_title(message: Message, state: FSMContext):
    await state.update_data(title=message.text.strip())
    await state.set_state(NewTaskFSM.waiting_description)
    await message.answer(
        "📄 Introdu <b>descrierea</b> sarcinii:\n<i>(trimite /skip daca nu este necesara)</i>",
        parse_mode="HTML",
    )


@router.message(NewTaskFSM.waiting_description, F.voice)
async def process_description_voice(message: Message, state: FSMContext):
    if not is_voice_available():
        await message.answer("⚠️ Functia vocala nu este configurata. Introdu descrierea manual:")
        return
    status_msg = await message.answer("🎙 Transcribing...")
    try:
        file_bytes = await _download_voice(message)
        desc = await transcribe_voice(file_bytes)
    except Exception:
        await status_msg.delete()
        await message.answer("❌ Transcription error. Please try again or type the description manually.")
        return
    await status_msg.delete()
    await state.update_data(description=desc)
    employees = await get_all_employees()
    if not employees:
        await message.answer("⚠️ Nu exista angajati inregistrati inca.")
        await state.clear()
        return
    await state.set_state(NewTaskFSM.waiting_assignee)
    await message.answer(
        f"🎙 Recognized: <b>{desc}</b>\n\n"
        f"👥 Selecteaza <b>responsabilul</b> sarcinii:",
        parse_mode="HTML",
        reply_markup=assignee_keyboard(employees),
    )


@router.message(NewTaskFSM.waiting_description)
async def process_description(message: Message, state: FSMContext):
    desc = None if message.text.strip() == "/skip" else message.text.strip()
    await state.update_data(description=desc)
    employees = await get_all_employees()
    if not employees:
        await message.answer("⚠️ Nu exista angajati inregistrati inca.")
        await state.clear()
        return
    await state.set_state(NewTaskFSM.waiting_assignee)
    await message.answer(
        "👥 Selecteaza <b>responsabilul</b> sarcinii:",
        parse_mode="HTML",
        reply_markup=assignee_keyboard(employees),
    )


@router.callback_query(NewTaskFSM.waiting_assignee, F.data.startswith("assign:"))
async def process_assignee(callback: CallbackQuery, state: FSMContext):
    assignee_id = callback.data.split(":")[1]
    await state.update_data(assignee_id=assignee_id)
    await state.set_state(NewTaskFSM.waiting_deadline)
    await callback.message.edit_text(
        "📅 Introdu <b>termenul limita</b> (format: ZZ.LL.AAAA)\n<i>Exemplu: 25.03.2025</i>",
        parse_mode="HTML",
    )


@router.message(NewTaskFSM.waiting_deadline)
async def process_deadline(message: Message, state: FSMContext):
    try:
        deadline = datetime.strptime(message.text.strip(), "%d.%m.%Y")
    except ValueError:
        await message.answer(
            "❌ Format incorect. Foloseste ZZ.LL.AAAA\n<i>Exemplu: 25.03.2025</i>",
            parse_mode="HTML",
        )
        return
    await state.update_data(deadline=deadline)
    await state.set_state(NewTaskFSM.waiting_priority)
    await message.answer(
        "⚡ Selecteaza <b>prioritatea</b> sarcinii:",
        parse_mode="HTML",
        reply_markup=priority_keyboard(),
    )


@router.callback_query(NewTaskFSM.waiting_priority, F.data.startswith("priority:"))
async def process_priority(callback: CallbackQuery, state: FSMContext, db_user: dict):
    priority = callback.data.split(":")[1]
    data = await state.get_data()
    await state.clear()

    task = await create_task(
        title=data["title"],
        description=data.get("description"),
        creator_id=db_user["id"],
        assignee_id=data["assignee_id"],
        deadline=data["deadline"],
        priority=priority,
    )

    assignee = await get_user_by_id(data["assignee_id"])
    deadline_str = data["deadline"].strftime("%d.%m.%Y")

    await callback.bot.send_message(
        chat_id=assignee["telegram_id"],
        text=(
            f"📋 <b>Ti-a fost atribuita o sarcina noua!</b>\n\n"
            f"<b>{task['title']}</b>\n"
            f"{task.get('description') or ''}\n\n"
            f"📅 Termen: <b>{deadline_str}</b>\n"
            f"⚡ Prioritate: {PRIORITY_LABELS[priority]}\n"
            f"👤 Atribuit de: {db_user['name']}"
        ),
        parse_mode="HTML",
        reply_markup=task_status_keyboard(task["id"]),
    )

    await callback.message.edit_text(
        f"✅ Sarcina <b>{task['title']}</b> a fost creata si atribuita lui "
        f"<b>{assignee['name']}</b>!",
        parse_mode="HTML",
    )


# ─── /mytasks ─────────────────────────────────────────────────────────────────

@router.message(Command("mytasks"))
async def cmd_mytasks(message: Message, db_user: dict):
    tasks = await get_tasks_for_user(db_user["id"])
    if not tasks:
        await message.answer("📭 Nu ai sarcini atribuite momentan.")
        return
    await message.answer(
        f"📋 <b>Sarcinile tale ({len(tasks)})</b>\nSelecteaza o sarcina pentru detalii:",
        parse_mode="HTML",
        reply_markup=tasks_list_keyboard(tasks),
    )


# ─── /alltasks ────────────────────────────────────────────────────────────────

@router.message(Command("alltasks"))
async def cmd_alltasks(message: Message, db_user: dict):
    if db_user["role"] != "manager":
        await message.answer("❌ Aceasta comanda este disponibila doar managerilor.")
        return
    tasks = await get_all_tasks()
    if not tasks:
        await message.answer("📭 Nu exista sarcini in sistem.")
        return
    await message.answer(
        f"📋 <b>Toate sarcinile ({len(tasks)})</b>:",
        parse_mode="HTML",
        reply_markup=tasks_list_keyboard(tasks),
    )


# ─── /overdue ─────────────────────────────────────────────────────────────────

@router.message(Command("overdue"))
async def cmd_overdue(message: Message, db_user: dict):
    if db_user["role"] != "manager":
        await message.answer("❌ Aceasta comanda este disponibila doar managerilor.")
        return
    tasks = await get_all_tasks(status="overdue")
    if not tasks:
        await message.answer("✅ Nu exista sarcini intarziate. Bravo echipei!")
        return
    lines = [f"❌ <b>Sarcini intarziate ({len(tasks)})</b>\n"]
    for task in tasks:
        assignee_name = task.get("assignee", {}).get("name", "—")
        deadline = task["deadline"][:10]
        lines.append(f"• <b>{task['title']}</b> — {assignee_name} (termen: {deadline})")
    await message.answer("\n".join(lines), parse_mode="HTML")


# ─── task_detail callback ──────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("task_detail:"))
async def show_task_detail(callback: CallbackQuery):
    from bot.services.task_service import get_task_by_id
    task_id = callback.data.split(":")[1]
    task = await get_task_by_id(task_id)
    if not task:
        await callback.answer("Sarcina nu a fost gasita.", show_alert=True)
        return

    assignee_name = task.get("assignee", {}).get("name", "—")
    creator_name = task.get("creator", {}).get("name", "—")
    deadline = task["deadline"][:10]
    priority_label = PRIORITY_LABELS.get(task["priority"], task["priority"])
    status_label = STATUS_LABELS.get(task["status"], task["status"])

    text = (
        f"📋 <b>{task['title']}</b>\n\n"
        f"{task.get('description') or '<i>Fara descriere</i>'}\n\n"
        f"👤 Responsabil: <b>{assignee_name}</b>\n"
        f"👤 Creat de: {creator_name}\n"
        f"📅 Termen: <b>{deadline}</b>\n"
        f"⚡ Prioritate: {priority_label}\n"
        f"📊 Status: {status_label}"
    )
    await callback.message.answer(
        text,
        parse_mode="HTML",
        reply_markup=task_status_keyboard(task_id),
    )
    await callback.answer()
