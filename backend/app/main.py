from contextlib import asynccontextmanager

from fastapi import FastAPI

from . import models  # noqa: F401  (registra las tablas en Base.metadata)
from .routers import auth, canchas, canchas_admin, config, disponibilidad, reservas
from .scheduler import iniciar_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = iniciar_scheduler()
    yield
    scheduler.shutdown()


app = FastAPI(title="El Túnel API", version="0.1.0", lifespan=lifespan)

app.include_router(auth.router, prefix="/api")
app.include_router(canchas.router, prefix="/api")
app.include_router(config.router, prefix="/api")
app.include_router(disponibilidad.router, prefix="/api")
app.include_router(reservas.router, prefix="/api")
app.include_router(canchas_admin.router, prefix="/api")
