import argparse
from decimal import Decimal, InvalidOperation
from getpass import getpass
from datetime import time

from sqlalchemy.exc import IntegrityError

from ..club_service import (
    ClubProvisioningError,
    create_club,
)
from ..database import SessionLocal


def _parse_time(value: str) -> time:
    try:
        return time.fromisoformat(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(
            "El horario debe tener formato HH:MM."
        ) from exc


def _parse_decimal(value: str) -> Decimal:
    try:
        return Decimal(value)
    except InvalidOperation as exc:
        raise argparse.ArgumentTypeError("Debe ser un número válido.") from exc


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Crea un club y todos sus datos iniciales."
    )
    parser.add_argument("--name", required=True, help="Nombre visible del club")
    parser.add_argument(
        "--subdomain",
        required=True,
        help="Subdominio sin el dominio base, por ejemplo: el-tunel",
    )
    parser.add_argument("--username", required=True, help="Usuario administrador")
    parser.add_argument("--email", required=True, help="Email administrador")
    parser.add_argument(
        "--password",
        help="Contraseña; si se omite se solicita de forma interactiva",
    )
    parser.add_argument("--plan", choices=("FREE", "BASICO"), default="FREE")
    parser.add_argument("--courts", type=int, default=3, help="Cantidad de canchas")
    parser.add_argument("--address", default="(completar dirección del club)")
    parser.add_argument("--alias", default="(completar alias MP)")
    parser.add_argument("--price", type=_parse_decimal, default=Decimal("30000.00"))
    parser.add_argument("--deposit", type=_parse_decimal, default=Decimal("5000.00"))
    parser.add_argument("--open", dest="opening_time", type=_parse_time, default=time(9, 0))
    parser.add_argument("--close", dest="closing_time", type=_parse_time, default=time(23, 0))
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.password is None:
        password = getpass("Contraseña del administrador: ")
        password_confirmation = getpass("Repetí la contraseña: ")
        if password != password_confirmation:
            print("Error: las contraseñas no coinciden.")
            return 1
    else:
        password = args.password

    try:
        with SessionLocal() as db:
            with db.begin():
                club = create_club(
                    db,
                    name=args.name,
                    subdomain=args.subdomain,
                    username=args.username,
                    email=args.email,
                    password=password,
                    plan=args.plan,
                    court_count=args.courts,
                    address=args.address,
                    transfer_alias=args.alias,
                    court_price=args.price,
                    deposit=args.deposit,
                    opening_time=args.opening_time,
                    closing_time=args.closing_time,
                )
                created_club = (club.nombre, club.subdominio, str(club.id))
    except (ClubProvisioningError, IntegrityError) as exc:
        print(f"Error: {exc}")
        return 1

    club_name, subdomain, club_id = created_club
    print(f"Club creado: {club_name}")
    print(f"Subdominio: {subdomain}.reservas-ya.com.ar")
    print(f"ID: {club_id}")
    print(f"Plan inicial: {args.plan}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
