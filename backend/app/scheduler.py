from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import select

from .database import SessionLocal
from .models import Reserva


def _expiar_pendientes() -> None:
    ahora = datetime.now(timezone.utc)
    with SessionLocal() as db:
        vencidas = db.scalars(
            select(Reserva).where(
                Reserva.estado == "PENDIENTE",
                Reserva.expira_en.is_not(None),
                Reserva.expira_en < ahora,
            )
        ).all()
        for reserva in vencidas:
            reserva.estado = "EXPIRADA"
        if vencidas:
            db.commit()


def iniciar_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        _expiar_pendientes,
        "interval",
        minutes=2,
        id="expiracion_reservas",
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    return scheduler
