#!/bin/sh
set -e

# Espera a que la base de datos esté lista (por si el healthcheck de compose no alcanza)
python - <<'PY'
import os
import time

from sqlalchemy import create_engine, text

engine = create_engine(os.environ["DATABASE_URL"])
for _ in range(30):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        break
    except Exception:
        time.sleep(1)
else:
    raise SystemExit("Base de datos no disponible tras 30s")
PY

# Aplica las migraciones (crea/actualiza el esquema)
alembic upgrade head

# La creación de clubes y administradores se realiza explícitamente mediante
# comandos administrativos; no se ejecuta ningún seed en producción.

exec "$@"
