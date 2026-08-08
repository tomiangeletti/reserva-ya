from datetime import time
from decimal import Decimal

from sqlalchemy import select

from .config import settings
from .database import SessionLocal
from .models import AdminUsuario, Cancha, ConfiguracionClub
from .security import hash_password


def seed() -> None:
    # Asume que el esquema ya existe (ejecutar `alembic upgrade head` primero).
    with SessionLocal() as db:
        if db.scalar(select(Cancha).limit(1)) is None:
            db.add_all(
                [
                    Cancha(nombre="Cancha 1"),
                    Cancha(nombre="Cancha 2"),
                    Cancha(nombre="Cancha 3"),
                ]
            )
            print("  + 3 canchas creadas")

        if db.scalar(select(AdminUsuario).limit(1)) is None:
            db.add(
                AdminUsuario(
                    username=settings.admin_username.lower(),
                    password_hash=hash_password(settings.admin_password),
                )
            )
            print(
                f"  + admin creado: {settings.admin_username} / {settings.admin_password}"
            )

        if db.scalar(select(ConfiguracionClub).limit(1)) is None:
            db.add(
                ConfiguracionClub(
                    direccion="(completar dirección del club)",
                    alias_transferencia="(completar alias MP)",
                    precio_cancha_default=Decimal("30000.00"),
                    monto_senia_default=Decimal("5000.00"),
                    adicional_pelotas=Decimal("0.00"),
                    telefono_whatsapp="",
                    hora_apertura=time(9, 0),
                    hora_cierre=time(23, 0),
                )
            )
            print("  + configuración del club creada (revisar valores default)")

        db.commit()
    print("Seed listo.")


if __name__ == "__main__":
    seed()
