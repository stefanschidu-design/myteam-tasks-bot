from datetime import datetime, timezone
from bot.services.supabase_client import get_supabase

TASK_SELECT = (
    "*, "
    "assignee:users!tasks_assignee_id_fkey(id, name, username, telegram_id), "
    "creator:users!tasks_creator_id_fkey(id, name)"
)


async def create_task(
    title: str,
    description: str | None,
    creator_id: str,
    assignee_id: str,
    deadline: datetime,
    priority: str = "medium",
) -> dict:
    db = get_supabase()
    result = db.table("tasks").insert({
        "title": title,
        "description": description,
        "creator_id": creator_id,
        "assignee_id": assignee_id,
        "deadline": deadline.isoformat(),
        "priority": priority,
        "status": "pending",
    }).execute()
    return result.data[0]


async def get_tasks_for_user(user_id: str) -> list[dict]:
    db = get_supabase()
    result = (db.table("tasks")
               .select(TASK_SELECT)
               .eq("assignee_id", user_id)
               .order("deadline", desc=False)
               .execute())
    return result.data


async def get_all_tasks(status: str | None = None) -> list[dict]:
    db = get_supabase()
    query = db.table("tasks").select(TASK_SELECT).order("deadline", desc=False)
    if status:
        query = query.eq("status", status)
    return query.execute().data


async def get_task_by_id(task_id: str) -> dict | None:
    db = get_supabase()
    result = db.table("tasks").select(TASK_SELECT).eq("id", task_id).execute()
    return result.data[0] if result.data else None


async def update_task_status(task_id: str, status: str) -> dict:
    db = get_supabase()
    result = (db.table("tasks")
               .update({"status": status})
               .eq("id", task_id)
               .execute())
    return result.data[0]


async def get_overdue_tasks() -> list[dict]:
    db = get_supabase()
    result = (db.table("tasks")
               .select(TASK_SELECT)
               .in_("status", ["pending", "in_progress"])
               .lt("deadline", datetime.now(timezone.utc).isoformat())
               .execute())
    return result.data


async def get_daily_summary() -> list[dict]:
    db = get_supabase()
    result = db.from_("task_summary").select("*").execute()
    return result.data
