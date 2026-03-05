from bot.services.supabase_client import get_supabase


async def get_or_create_user(telegram_id: int, name: str, username: str | None) -> dict:
    db = get_supabase()
    result = db.table("users").select("*").eq("telegram_id", telegram_id).execute()
    if result.data:
        return result.data[0]
    insert_result = db.table("users").insert({
        "telegram_id": telegram_id,
        "name": name,
        "username": username,
        "role": "employee",
    }).execute()
    return insert_result.data[0]


async def get_user_by_telegram_id(telegram_id: int) -> dict | None:
    db = get_supabase()
    result = db.table("users").select("*").eq("telegram_id", telegram_id).execute()
    return result.data[0] if result.data else None


async def get_user_by_id(user_id: str) -> dict | None:
    db = get_supabase()
    result = db.table("users").select("*").eq("id", user_id).execute()
    return result.data[0] if result.data else None


async def get_all_employees() -> list[dict]:
    db = get_supabase()
    result = (db.table("users")
               .select("id, name, username")
               .eq("is_active", True)
               .order("name")
               .execute())
    return result.data
