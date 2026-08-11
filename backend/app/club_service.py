from datetime import datetime, time, timedelta, timezone
from decimal import Decimal
import re
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import (
    AdminUsuario,
    Cancha,
    Club,
    ClubSuscripcion,
    ConfiguracionClub,
)
from .security import hash_password

TRIAL_DAYS = 14
DEFAULT_COURT_COUNT = 3
DEFAULT_COURT_NAMES = ("Cancha 1", "Cancha 2", "Cancha 3")
DEFAULT_ADDRESS = "(completar dirección del club)"
DEFAULT_TRANSFER_ALIAS = "(completar alias MP)"
DEFAULT_COURT_PRICE = Decimal("30000.00")
DEFAULT_DEPOSIT = Decimal("5000.00")
DEFAULT_OPENING_TIME = time(9, 0)
DEFAULT_CLOSING_TIME = time(23, 0)

_SUBDOMAIN_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class ClubProvisioningError(ValueError):
    """Error de validación al crear o administrar un club."""


def normalize_subdomain(value: str) -> str:
    subdomain = value.strip().lower()
    if not 1 <= len(subdomain) <= 80:
        raise ClubProvisioningError(
            "El subdominio debe tener entre 1 y 80 caracteres."
        )
    if not _SUBDOMAIN_PATTERN.fullmatch(subdomain):
        raise ClubProvisioningError(
            "El subdominio solo puede contener letras minúsculas, números y guiones."
        )
    return subdomain


def normalize_username(value: str) -> str:
    username = value.strip().lower()
    if not 3 <= len(username) <= 50:
        raise ClubProvisioningError(
            "El usuario debe tener entre 3 y 50 caracteres."
        )
    return username


def normalize_email(value: str) -> str:
    email = value.strip().lower()
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise ClubProvisioningError("El email no tiene un formato válido.")
    return email


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _subscription_values(plan: str, now: datetime) -> dict:
    plan = plan.upper()
    if plan not in {"FREE", "BASICO"}:
        raise ClubProvisioningError("El plan debe ser FREE o BASICO.")

    if plan == "FREE":
        return {
            "plan": "FREE",
            "estado": "TRIAL",
            "trial_inicia_en": now,
            "trial_expira_en": now + timedelta(days=TRIAL_DAYS),
            "activada_en": None,
            "expira_en": None,
        }

    return {
        "plan": "BASICO",
        "estado": "ACTIVO",
        "trial_inicia_en": None,
        "trial_expira_en": None,
        "activada_en": now,
        "expira_en": None,
    }


def create_club(
    db: Session,
    *,
    name: str,
    subdomain: str,
    username: str,
    email: str,
    password: str,
    plan: str = "FREE",
    court_count: int = DEFAULT_COURT_COUNT,
    address: str = DEFAULT_ADDRESS,
    transfer_alias: str = DEFAULT_TRANSFER_ALIAS,
    court_price: Decimal = DEFAULT_COURT_PRICE,
    deposit: Decimal = DEFAULT_DEPOSIT,
    opening_time: time = DEFAULT_OPENING_TIME,
    closing_time: time = DEFAULT_CLOSING_TIME,
) -> Club:
    name = name.strip()
    if not name or len(name) > 150:
        raise ClubProvisioningError(
            "El nombre del club es obligatorio y no puede superar 150 caracteres."
        )
    if len(password) < 8:
        raise ClubProvisioningError("La contraseña debe tener al menos 8 caracteres.")
    if court_count < 1 or court_count > 50:
        raise ClubProvisioningError("La cantidad de canchas debe estar entre 1 y 50.")
    if court_price <= 0 or deposit <= 0:
        raise ClubProvisioningError("El precio y la seña deben ser mayores a cero.")

    subdomain = normalize_subdomain(subdomain)
    username = normalize_username(username)
    email = normalize_email(email)

    if db.scalar(select(Club).where(Club.subdominio == subdomain)):
        raise ClubProvisioningError(
            f"Ya existe un club con el subdominio '{subdomain}'."
        )
    if db.scalar(select(Club).where(Club.slug == subdomain)):
        raise ClubProvisioningError(f"Ya existe un club con el slug '{subdomain}'.")
    if db.scalar(select(AdminUsuario).where(AdminUsuario.username == username)):
        raise ClubProvisioningError(f"Ya existe el usuario '{username}'.")
    if db.scalar(select(AdminUsuario).where(AdminUsuario.email == email)):
        raise ClubProvisioningError(f"Ya existe el email '{email}'.")

    now = _now()
    club = Club(
        nombre=name,
        slug=subdomain,
        subdominio=subdomain,
        activo=True,
    )
    db.add(club)
    db.flush()

    db.add(
        ClubSuscripcion(
            club_id=club.id,
            **_subscription_values(plan, now),
            created_at=now,
            updated_at=now,
        )
    )
    db.add(
        AdminUsuario(
            club_id=club.id,
            username=username,
            email=email,
            password_hash=hash_password(password),
            activo=True,
            created_at=now,
            updated_at=now,
        )
    )
    db.add(
        ConfiguracionClub(
            club_id=club.id,
            direccion=address.strip(),
            alias_transferencia=transfer_alias.strip(),
            precio_cancha_default=court_price,
            monto_senia_default=deposit,
            adicional_pelotas=Decimal("0.00"),
            telefono_whatsapp="",
            hora_apertura=opening_time,
            hora_cierre=closing_time,
            created_at=now,
            updated_at=now,
        )
    )

    court_names = list(DEFAULT_COURT_NAMES[:court_count])
    court_names.extend(
        f"Cancha {number}"
        for number in range(len(court_names) + 1, court_count + 1)
    )
    db.add_all(
        [
            Cancha(
                club_id=club.id,
                nombre=court_name,
                activo=True,
                created_at=now,
                updated_at=now,
            )
            for court_name in court_names
        ]
    )

    return club


def get_club_by_subdomain(db: Session, subdomain: str) -> Club:
    normalized = normalize_subdomain(subdomain)
    club = db.scalar(select(Club).where(Club.subdominio == normalized))
    if club is None:
        raise ClubProvisioningError(
            f"No existe un club con el subdominio '{normalized}'."
        )
    return club


def activate_basic(db: Session, subdomain: str) -> Club:
    club = get_club_by_subdomain(db, subdomain)
    subscription = db.scalar(
        select(ClubSuscripcion).where(ClubSuscripcion.club_id == club.id)
    )
    if subscription is None:
        raise ClubProvisioningError("El club no tiene una suscripción configurada.")

    now = _now()
    subscription.plan = "BASICO"
    subscription.estado = "ACTIVO"
    subscription.trial_inicia_en = None
    subscription.trial_expira_en = None
    subscription.activada_en = now
    subscription.expira_en = None
    subscription.updated_at = now
    return club


def suspend_club(db: Session, subdomain: str) -> Club:
    club = get_club_by_subdomain(db, subdomain)
    subscription = db.scalar(
        select(ClubSuscripcion).where(ClubSuscripcion.club_id == club.id)
    )
    if subscription is None:
        raise ClubProvisioningError("El club no tiene una suscripción configurada.")

    subscription.estado = "SUSPENDIDO"
    subscription.updated_at = _now()
    return club


def reactivate_club(db: Session, subdomain: str) -> Club:
    club = get_club_by_subdomain(db, subdomain)
    subscription = db.scalar(
        select(ClubSuscripcion).where(ClubSuscripcion.club_id == club.id)
    )
    if subscription is None:
        raise ClubProvisioningError("El club no tiene una suscripción configurada.")

    now = _now()
    if subscription.plan == "BASICO":
        subscription.estado = "ACTIVO"
    elif (
        subscription.plan == "FREE"
        and subscription.trial_expira_en is not None
        and subscription.trial_expira_en > now
    ):
        subscription.estado = "TRIAL"
    else:
        raise ClubProvisioningError(
            "El trial Free ya expiró; activá el plan Básico para reactivar el club."
        )

    subscription.updated_at = now
    return club
