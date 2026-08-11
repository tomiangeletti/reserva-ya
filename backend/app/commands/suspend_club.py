import argparse

from sqlalchemy.exc import IntegrityError

from ..club_service import ClubProvisioningError, suspend_club
from ..database import SessionLocal


def main() -> int:
    parser = argparse.ArgumentParser(description="Suspende un club.")
    parser.add_argument("--subdomain", required=True)
    args = parser.parse_args()

    try:
        with SessionLocal() as db:
            with db.begin():
                club = suspend_club(db, args.subdomain)
                subdomain = club.subdominio
    except (ClubProvisioningError, IntegrityError) as exc:
        print(f"Error: {exc}")
        return 1

    print(f"Club suspendido: {subdomain}.reservas-ya.com.ar")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
