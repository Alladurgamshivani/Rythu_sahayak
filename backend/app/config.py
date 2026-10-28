from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./rythu_sahayak.db"
    demo_username: str = "demo_officer"
    demo_password: str = "ChangeThisDemoPassword123!"
    jwt_secret: str = "dev-only-change-this-secret-before-deployment"
    token_expire_minutes: int = 480
    frontend_origin: str = "http://localhost:5173"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
