import aiohttp
from bot.config import settings


def is_voice_available() -> bool:
    """Check if ElevenLabs API key is configured."""
    return bool(settings.ELEVENLABS_API_KEY)


async def transcribe_voice(file_bytes: bytes, filename: str = "voice.ogg") -> str:
    """Send audio bytes to ElevenLabs STT and return transcribed text."""
    if not is_voice_available():
        raise RuntimeError("ElevenLabs API key not configured")
    url = "https://api.elevenlabs.io/v1/speech-to-text"
    headers = {"xi-api-key": settings.ELEVENLABS_API_KEY}

    form = aiohttp.FormData()
    form.add_field("file", file_bytes, filename=filename, content_type="audio/ogg")
    form.add_field("model_id", "scribe_v1")

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, data=form) as resp:
            if resp.status != 200:
                text = await resp.text()
                raise RuntimeError(f"ElevenLabs STT error {resp.status}: {text}")
            data = await resp.json()
            return data["text"].strip()
