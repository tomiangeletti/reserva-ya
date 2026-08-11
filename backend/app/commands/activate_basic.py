import argparse

from sqlalchemy.exc import IntegrityError

from ..club_service import ClubProvisioningError, activate_basic
from ..database import SessionLocal


def main() -> int:
    parser = argparse.ArgumentParser(description="Activa el plan Básico de un club.")
    parser.add_argument("--subdomain", required=True)
    args = parser.parse_args()

    try:
        with SessionLocal() as db:
            with db.begin():
                club = activate_basic(db, args.subdomain)
                subdomain = club.subdominio
    except (ClubProvisioningError, IntegrityError) as exc:
        print(f"Error: {exc}")
        return 1

    print(f"Plan Básico activado para {subdomain}.reservas-ya.com.ar")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
