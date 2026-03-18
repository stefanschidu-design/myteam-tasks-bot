from pathlib import Path
from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    BOT_TOKEN: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    MANAGER_TELEGRAM_ID: int
    WEBAPP_URL: str
    WEBHOOK_URL: str
    WEBHOOK_SECRET: str
    ELEVENLABS_API_KEY: str = ""

    class Config:
        env_file = str(_ENV_FILE)
        extra = "ignore"


settings = Settings()
