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
    club_timezone: str = "America/Argentina/Buenos_Aires"
    # URL pública de cada club; {subdominio} se reemplaza por el del club.
    # En desarrollo: http://{subdominio}.localhost:5173
    club_url_template: str = "https://{subdominio}.reservas-ya.com.ar"

    def club_url(self, subdominio: str) -> str:
        return self.club_url_template.format(subdominio=subdominio).rstrip("/")

    environment: str = "development"


settings = Settings()
