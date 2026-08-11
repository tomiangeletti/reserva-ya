from datetime import datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select

from .club_service import create_club
from .config import settings
from .database import SessionLocal
from .models import AdminUsuario, Cancha, Club, ClubSuscripcion, ConfiguracionClub
from .security import hash_password


DEMO_SUBDOMAIN = "el-tunel"


def seed() -> None:
    """Prepara datos demo; no debe ejecutarse automáticamente en producción."""
    if not settings.seed_demo:
        raise SystemExit(
            "Seed demo desactivado. Definí SEED_DEMO=true para usarlo explícitamente."
        )

    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        with db.begin():
            club = db.scalar(
                select(Club).where(Club.subdominio == DEMO_SUBDOMAIN)
            )

            if club is None:
                club = create_club(
                    db,
                    name="El Túnel",
                    subdomain=DEMO_SUBDOMAIN,
                    username=settings.admin_username,
                    email=settings.admin_email,
                    password=settings.admin_password,
                )
                print("Seed demo: club, administrador y datos iniciales creados.")
                return

            subscription = db.scalar(
                select(ClubSuscripcion).where(
                    ClubSuscripcion.club_id == club.id
                )
            )
            if subscription is None:
                db.add(
                    ClubSuscripcion(
                        club_id=club.id,
                        plan="FREE",
                        estado="TRIAL",
                        trial_inicia_en=now,
                        trial_expira_en=now + timedelta(days=14),
                        created_at=now,
                        updated_at=now,
                    )
                )

            admin = db.scalar(
                select(AdminUsuario).where(AdminUsuario.club_id == club.id)
            )
            if admin is None:
                db.add(
                    AdminUsuario(
                        club_id=club.id,
                        username=settings.admin_username.lower(),
                        email=settings.admin_email.lower(),
                        password_hash=hash_password(settings.admin_password),
                        activo=True,
                        created_at=now,
                        updated_at=now,
                    )
                )

            config = db.scalar(
                select(ConfiguracionClub).where(
                    ConfiguracionClub.club_id == club.id
                )
            )
            if config is None:
                db.add(
                    ConfiguracionClub(
                        club_id=club.id,
                        direccion="(completar dirección del club)",
                        alias_transferencia="(completar alias MP)",
                        precio_cancha_default=Decimal("30000.00"),
                        monto_senia_default=Decimal("5000.00"),
                        adicional_pelotas=Decimal("0.00"),
                        telefono_whatsapp="",
                        hora_apertura=time(9, 0),
                        hora_cierre=time(23, 0),
                        created_at=now,
                        updated_at=now,
                    )
                )

            if db.scalar(select(Cancha.id).where(Cancha.club_id == club.id)) is None:
                db.add_all(
                    [
                        Cancha(
                            club_id=club.id,
                            nombre=f"Cancha {number}",
                            activo=True,
                            created_at=now,
                            updated_at=now,
                        )
                        for number in range(1, 4)
                    ]
                )

    print("Seed demo listo.")


if __name__ == "__main__":
    seed()
