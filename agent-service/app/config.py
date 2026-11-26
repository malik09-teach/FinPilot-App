from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = Field(default="development", alias="APP_ENV")
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Backend connection
    backend_base_url: str = Field(default="http://localhost:4000", alias="BACKEND_BASE_URL")
    agent_service_token: str = Field(
        default="dev-agent-service-token",
        alias="AGENT_SERVICE_TOKEN",
    )

    # Groq LLM config (env-only; never hardcode model names)
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    groq_model_router: str = Field(default="", alias="GROQ_MODEL_ROUTER")
    groq_model_agent: str = Field(default="", alias="GROQ_MODEL_AGENT")
    groq_timeout_seconds: float = Field(default=30.0, alias="GROQ_TIMEOUT_SECONDS")
    groq_max_retries: int = Field(default=3, alias="GROQ_MAX_RETRIES")

    # Caps and concurrency
    max_tool_steps: int = Field(default=6, alias="MAX_TOOL_STEPS")
    max_request_tokens: int = Field(default=8192, alias="MAX_REQUEST_TOKENS")
    per_tool_timeout_seconds: float = Field(default=10.0, alias="PER_TOOL_TIMEOUT_SECONDS")
    overall_timeout_seconds: float = Field(default=45.0, alias="OVERALL_TIMEOUT_SECONDS")
    max_concurrent_global: int = Field(default=32, alias="MAX_CONCURRENT_GLOBAL")
    max_concurrent_per_user: int = Field(default=3, alias="MAX_CONCURRENT_PER_USER")
    history_window_messages: int = Field(default=12, alias="HISTORY_WINDOW_MESSAGES")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
