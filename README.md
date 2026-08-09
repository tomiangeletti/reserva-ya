# Reservas ya

Sistema web de reservas personalizable para clubes de pádel y otros negocios
que trabajan con turnos. Permite que los clientes consulten disponibilidad y
soliciten reservas sin crear una cuenta, mientras cada negocio administra sus
turnos, reservas y configuración desde un panel privado.

## Funcionalidades

- Flujo público mobile-first para elegir fecha, cancha y horario.
- Reserva pendiente durante 30 minutos hasta confirmar la seña.
- Expiración automática de reservas no confirmadas.
- Panel de administración con autenticación JWT.
- Confirmación y cancelación de reservas.
- Turnos fijos recurrentes y bloqueos puntuales.
- Restricción en base de datos para evitar reservas simultáneas del mismo slot.
- Migraciones versionadas con Alembic.

## Stack

- **Backend:** FastAPI, SQLAlchemy 2, Pydantic 2, Alembic, PostgreSQL/SQLite.
- **Frontend:** React 19, React Router, Vite.
- **Infraestructura:** Docker Compose, PostgreSQL 16 y Nginx.

## Estructura del proyecto

```text
.
├── backend/
│   ├── app/
│   │   ├── routers/             # endpoints públicos y administrativos
│   │   ├── main.py              # aplicación FastAPI y registro de rutas
│   │   ├── models.py            # modelos SQLAlchemy
│   │   ├── schemas.py           # validación Pydantic
│   │   ├── security.py          # JWT, bcrypt y tokens de recuperación
│   │   ├── email_utils.py       # envío de emails de recuperación
│   │   ├── slots.py             # disponibilidad y grilla de turnos
│   │   ├── scheduler.py         # expiración automática de reservas
│   │   ├── seed.py              # datos iniciales
│   │   └── config.py            # configuración desde variables de entorno
│   ├── alembic/                 # migraciones versionadas
│   │   └── versions/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── entrypoint.sh
├── frontend/
│   ├── src/
│   │   ├── pages/               # estado y composición de cada ruta
│   │   │   ├── admin/
│   │   │   ├── reservar/
│   │   │   └── privacidad/
│   │   ├── components/          # componentes agrupados por pantalla
│   │   │   ├── AdminLayout/
│   │   │   ├── DashboardPage/
│   │   │   ├── ReservasPage/
│   │   │   ├── CanchasPage/
│   │   │   ├── ConfiguracionPage/
│   │   │   ├── ReservarPage/
│   │   │   ├── PasswordResetPage/
│   │   │   └── LoginPage/
│   │   ├── api/                 # cliente HTTP y autenticación
│   │   └── index.css             # variables y estilos globales
│   ├── public/                  # favicon y recursos públicos
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml           # PostgreSQL, API y frontend
├── .env.example                 # variables para Docker
├── .github/workflows/ci.yml     # lint, build y validación del backend
├── PLAN.md                      # alcance y decisiones de producto
├── SECURITY.md                  # recomendaciones de seguridad
├── LICENSE                      # licencia de uso del proyecto
└── README.md
```

El frontend separa la lógica de cada pantalla de sus piezas visuales. Las
páginas coordinan estado, llamadas a la API y eventos; los componentes reciben
datos y callbacks por props para facilitar su reutilización y mantenimiento.

## Requisitos

Para desarrollo local se necesita Python 3.11+, Node.js 22+ y npm. Para
levantar todo con una sola orden, se necesita Docker Desktop con Compose.

## Ejecución con Docker

```powershell
Copy-Item .env.example .env
# Editar .env: definir una contraseña de PostgreSQL, JWT_SECRET y ADMIN_PASSWORD
docker compose up --build
```

URLs disponibles:

- Frontend: <http://localhost:8080>
- API: <http://localhost:8000>
- Swagger: <http://localhost:8000/docs>
- PostgreSQL: `localhost:5433`

El backend aplica las migraciones y ejecuta el seed al iniciar. El seed crea
las canchas, la configuración inicial y el usuario administrador si todavía no
existen. Los datos quedan en el volumen `pgdata`.

```powershell
docker compose down       # detiene servicios, conserva datos
docker compose down -v     # detiene servicios y elimina la base local
```

## Desarrollo local

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

La API queda disponible en <http://localhost:8000>. El archivo `backend/.env`
es local y está excluido del repositorio.

### Frontend

En otra terminal:

```powershell
cd frontend
npm ci
npm run dev
```

La aplicación queda disponible en <http://localhost:5173>. El proxy de Vite
redirige `/api` al backend local.

## Comandos de calidad

```powershell
cd frontend
npm run lint
npm run build
```

El backend no incluye todavía una suite de tests automatizados. Como mínimo,
se puede comprobar que sus módulos compilan con:

```powershell
cd backend
python -m compileall app
```

## Migraciones

Cada cambio de modelo debe incluir una migración nueva:

```powershell
cd backend
alembic revision --autogenerate -m "descripcion del cambio"
alembic upgrade head
```

No se usa `create_all` para crear el esquema: los entornos deben sincronizarse
con `alembic upgrade head`.

## Configuración y seguridad

Los valores sensibles se configuran mediante variables de entorno. Nunca
commitees `.env`, contraseñas reales, tokens o datos de clientes. Los valores
de `.env.example` son solo una plantilla.

Antes de un despliegue real, cambiá especialmente:

- `JWT_SECRET` por un secreto aleatorio largo;
- `ADMIN_PASSWORD` por una contraseña fuerte y única;
- `POSTGRES_PASSWORD` por una contraseña exclusiva del entorno.

Más información en [SECURITY.md](SECURITY.md).

## API

La documentación interactiva está en `/docs` cuando el backend está activo.
Los endpoints públicos principales son `/api/config`, `/api/canchas`,
`/api/disponibilidad` y `/api/reservas`. Los endpoints de administración
requieren `Authorization: Bearer <token>`.

### Recuperación de contraseña

El frontend conecta el flujo de recuperación con los endpoints existentes del
backend:

- `/recuperar-password` solicita el email del administrador y envía el pedido a
  `POST /api/auth/forgot-password`.
- `/reset-password?token=...` permite definir la nueva contraseña y envía el
  token junto con `new_password` a `POST /api/auth/password/reset`.
- El login incluye el enlace para iniciar la recuperación.
- El panel administrativo incluye `Cambiar contraseña`, que inicia el mismo
  flujo por email.

La página no almacena tokens ni contraseñas en el navegador. La contraseña se
valida localmente para exigir al menos 8 caracteres y confirmar ambos campos;
la validación definitiva continúa siendo responsabilidad del backend.

## Dashboard administrativo

La pantalla `/admin` funciona como resumen operativo y no requiere endpoints
nuevos ni tablas adicionales. Al abrirla, consulta en paralelo:

- `GET /api/reservas?filtro=hoy` para construir la agenda del día y contar las
  reservas activas y confirmadas;
- `GET /api/reservas/pendientes/count` para mostrar el total global de reservas
  pendientes de confirmación.

La información se actualiza automáticamente cada 30 segundos. Las reservas en
estado `CANCELADA` o `EXPIRADA` no se muestran en la agenda ni se incluyen en
los totales de reservas activas. Si no hay reservas, se muestra un estado vacío
en lugar de datos de ejemplo.

## Estado del proyecto

La implementación actual cubre el alcance funcional de la v1 descrito en
[PLAN.md](PLAN.md). Quedan fuera de esta versión las cuentas de clientes,
roles múltiples, pagos online, notificaciones y reportes.

## Licencia

Código publicado bajo una licencia personalizada de derechos reservados.
Permite únicamente la consulta, evaluación y demostración del proyecto.
No se permite su uso comercial, redistribución, modificación ni creación de
trabajos derivados sin autorización previa y expresa. Ver [LICENSE](LICENSE).
