from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    agent_mode: str = "fallback"  # fallback | llm
    xai_api_key: str = ""
    xai_model: str = "grok-4.5"
    xai_base_url: str = "https://api.x.ai/v1"
    agent_cache_dir: str = ".cache/agents"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    max_mixtures_per_chart: int = 8
    max_units_per_faction: int = 24
    units_per_planet: int = 3
    prompt_version: str = "v2"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def cache_path(self) -> Path:
        path = Path(self.agent_cache_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()
