from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://eltunel:eltunel_dev@localhost:5433/eltunel"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    admin_username: str = "admin"
    admin_email: str = "admin@localhost.test"
    admin_password: str = "admin1234"
    seed_demo: bool = False

    resend_api_key: str = ""

    tenant_base_domain: str = "reservas-ya.com.ar"

    environment: str = "development"


settings = Settings()
