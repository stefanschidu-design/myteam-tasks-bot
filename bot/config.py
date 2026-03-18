import os
from pathlib import Path
from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    BOT_TOKEN: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    MANAGER_TELEGRAM_ID: int
    WEBAPP_URL: str
    WEBHOOK_URL: str = ""
    WEBHOOK_SECRET: str = "default_secret"
    ELEVENLABS_API_KEY: str = ""

    class Config:
        env_file = str(_ENV_FILE)
        extra = "ignore"


settings = Settings()

# Auto-detect Render URL if WEBHOOK_URL not set
if not settings.WEBHOOK_URL:
    render_url = os.environ.get("RENDER_EXTERNAL_URL", "")
    if render_url:
        settings.WEBHOOK_URL = render_url
