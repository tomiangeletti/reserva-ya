# Plan Definitivo de Reestructuración Backend

## 0. Decisiones cerradas

- Dominio compartido: `reservas-ya.com.ar`.
- Cada club tendrá un subdominio:
  - `club-a.reservas-ya.com.ar`
  - `club-b.reservas-ya.com.ar`
- Cada club tendrá inicialmente un único administrador.
- Los clientes no tendrán cuentas.
- Free:
  - Acceso durante 14 días.
  - Luego queda expirado.
- Básico:
  - Activación manual.
  - Acceso permanente.
- Premium:
  - Deploy separado.
  - No se implementan dominios personalizados en el deploy compartido.
- Club expirado o suspendido:
  - Login: `404`.
  - Panel admin: `404`.
  - Reservas públicas: `404`.
  - Disponibilidad pública: `404`.
- El JWT tendrá `sub`, `iat` y `exp`.
- No se confiará en `club_id` dentro del JWT.
- El club administrativo se resolverá siempre desde `admin_usuario.club_id`.
- El club público se resolverá desde el hostname.

## Fase 1: Modelo de datos

### 1. Crear tabla `clubs`

Representa cada club registrado en la plataforma.

```text
clubs
-----
id
nombre
slug
subdominio
activo
created_at
updated_at
```

Restricciones:

```text
UNIQUE (slug)
UNIQUE (subdominio)
```

El `subdominio` debe contener solamente el prefijo:

```text
el-tunel
```

No se debe guardar el dominio completo:

```text
el-tunel.reservas-ya.com.ar
```

### 2. Crear tabla `club_suscripciones`

Como por ahora la activación es manual y no habrá pagos automáticos, una suscripción actual por club es suficiente.

```text
club_suscripciones
------------------
id
club_id
plan
estado
trial_inicia_en
trial_expira_en
activada_en
expira_en
observaciones
created_at
updated_at
```

Restricción:

```text
UNIQUE (club_id)
```

Valores permitidos:

```text
plan:
  FREE
  BASICO

estado:
  TRIAL
  ACTIVO
  EXPIRADO
  SUSPENDIDO
```

Reglas:

```text
FREE:
  estado = TRIAL
  trial_inicia_en = fecha de creación
  trial_expira_en = trial_inicia_en + 14 días

BASICO:
  estado = ACTIVO
  activada_en = fecha de activación manual
  trial_expira_en = NULL
  expira_en = NULL
```

### 3. Modificar `admin_usuario`

Agregar:

```text
club_id
activo
created_at
updated_at
ultimo_login_en
```

Agregar:

```text
FOREIGN KEY (club_id) REFERENCES clubs(id)
UNIQUE (club_id)
```

El `UNIQUE (club_id)` mantiene la regla de un administrador por club.

No cambiar el nombre de la tabla todavía para evitar una migración innecesaria.

### 4. Modificar tablas operativas

Agregar `club_id` a:

```text
canchas
reservas
turnos_fijos
bloqueos_puntuales
configuracion_club
```

Agregar también `created_at` y `updated_at` donde falten.

#### `canchas`

Reemplazar:

```text
UNIQUE (nombre)
```

por:

```text
UNIQUE (club_id, nombre)
```

#### `reservas`

Mantener la restricción de reserva activa, agregando `club_id`:

```text
UNIQUE (club_id, cancha_id, fecha, hora_inicio)
WHERE estado IN ('PENDIENTE', 'CONFIRMADA')
```

Agregar opcionalmente:

```text
cancelada_en
updated_at
```

#### `turnos_fijos`

Restricción:

```text
UNIQUE (
  club_id,
  cancha_id,
  dia_semana,
  hora_inicio
)
```

#### `bloqueos_puntuales`

Restricción:

```text
UNIQUE (
  club_id,
  cancha_id,
  fecha,
  hora_inicio
)
```

Reemplazar progresivamente `creado_por`, que hoy es texto, por:

```text
creado_por_admin_id
```

#### `configuracion_club`

Agregar:

```text
club_id
created_at
updated_at
```

Restricción:

```text
UNIQUE (club_id)
```

### 5. Modificar `password_reset_token`

No es obligatorio agregar `club_id`, porque ya existe la relación:

```text
password_reset_token
  -> admin_usuario
  -> club_id
```

Agregar:

```text
created_at
used_at
```

## Fase 2: Migración de datos

La migración debe realizarse en pasos para no romper la base actual.

1. Crear `clubs`.
2. Crear `club_suscripciones`.
3. Insertar el club actual.
4. Crear la suscripción Free del club actual.
5. Agregar `club_id` como nullable a las tablas existentes.
6. Asociar todos los registros actuales al nuevo club.
7. Asociar el administrador actual al nuevo club.
8. Crear la configuración única para ese club.
9. Verificar que no existan registros sin `club_id`.
10. Convertir las columnas `club_id` a `NOT NULL`.
11. Crear foreign keys.
12. Reemplazar índices únicos globales por índices únicos por club.
13. Agregar índices de búsqueda.

Índices recomendados:

```text
clubs.subdominio
admin_usuario.club_id
canchas.club_id
reservas.club_id, reservas.fecha
reservas.club_id, reservas.estado
turnos_fijos.club_id
bloqueos_puntuales.club_id, bloqueos_puntuales.fecha
club_suscripciones.estado
```

No eliminar el club anterior ni sus registros.

## Fase 3: Seed y alta manual de clubes

### 1. Modificar `seed.py`

El seed no debe crear registros globales.

Debe crear:

```text
club
suscripción
admin
configuración
canchas
```

El seed debe ser idempotente y no debe crear un segundo club si ya existe el club inicial.

### 2. Crear comando de alta

Agregar un comando equivalente a:

```text
python -m app.commands.create_club
```

Debe recibir:

```text
nombre del club
subdominio
username
email
password
plan inicial
```

Para un Free nuevo:

```text
plan = FREE
estado = TRIAL
trial_expira_en = ahora + 14 días
```

Para activar Básico manualmente:

```text
python -m app.commands.activate_basic --subdomain club-a
```

La activación debe establecer:

```text
plan = BASICO
estado = ACTIVO
activada_en = ahora
trial_expira_en = NULL
expira_en = NULL
```

También deben existir operaciones para:

```text
suspender club
reactivar club
```

## Fase 4: Resolución de tenant

Crear un módulo dedicado:

```text
backend/app/tenant.py
```

Centralizar allí:

```text
get_request_subdomain()
resolve_public_tenant()
get_public_tenant()
get_current_admin_tenant()
subscription_is_valid()
require_valid_subscription()
```

### Endpoints públicos

El club se resuelve desde `request.url.hostname`.

Ejemplo:

```text
el-tunel.reservas-ya.com.ar
```

Se obtiene:

```text
el-tunel
```

Luego se busca el club y su suscripción.

La dependencia pública debe:

1. Leer el hostname.
2. Validar que pertenece a `reservas-ya.com.ar`.
3. Extraer el subdominio.
4. Buscar el club.
5. Verificar `clubs.activo`.
6. Verificar la suscripción.
7. Devolver el contexto del club.

Si falla cualquier paso:

```http
404 Not Found
```

### Endpoints administrativos

El flujo debe ser:

```text
JWT.sub
  -> admin_usuario.id
  -> admin_usuario.club_id
  -> club
  -> club_suscripcion
```

Nunca se debe usar para autorización:

```text
request.hostname
club_id del body
club_id del query string
club_id de la URL
club_id del JWT
```

El hostname no determina el tenant administrativo.

## Fase 5: Autenticación

### 1. Modificar login

El login debe recibir `Request` y resolver el club desde el subdominio.

El administrador se busca dentro del club:

```text
WHERE username = payload.username
AND club_id = tenant.club.id
AND activo = TRUE
```

Antes de validar la contraseña se debe comprobar que el club está operativo.

Si está expirado o suspendido:

```http
404 Not Found
```

### 2. JWT

Mantener:

```json
{
  "sub": "admin_id",
  "iat": 123456,
  "exp": 123456
}
```

No utilizar `club_id` como autoridad dentro del JWT.

Recomendación:

```text
JWT_EXPIRE_MINUTES=60
```

El bloqueo real no dependerá del vencimiento del JWT, sino de consultar la suscripción en cada request.

### 3. Validación administrativa

La dependencia administrativa debe:

1. Extraer el Bearer token.
2. Decodificar el JWT.
3. Obtener `admin_id`.
4. Buscar el admin activo.
5. Resolver `club_id` desde el admin.
6. Buscar el club.
7. Buscar la suscripción.
8. Validar estado.
9. Devolver `admin`, `club` y `subscription`.

Si el token es inválido:

```http
401 Unauthorized
```

Si el club no existe, está expirado o suspendido:

```http
404 Not Found
```

## Fase 6: Chequeo de suscripción

Se consideran válidos únicamente:

```text
TRIAL
ACTIVO
```

Para `TRIAL`:

```text
trial_expira_en > ahora
```

Estados bloqueados:

```text
EXPIRADO
SUSPENDIDO
```

### Login

El login de un club expirado o suspendido se bloquea con `404`.

### Panel administrativo

La validación debe ejecutarse en cada endpoint administrativo para invalidar inmediatamente JWT emitidos anteriormente.

### Flujo público

Deben bloquearse:

```text
GET /api/canchas
GET /api/config
GET /api/disponibilidad
POST /api/reservas
```

### Recuperación de contraseña

También debe validarse el tenant en:

```text
POST /api/auth/forgot-password
POST /api/auth/password/reset
```

El token debe pertenecer a un administrador del mismo club resuelto por hostname.

## Fase 7: Aislamiento de queries

Nunca hacer en endpoints administrativos:

```python
db.get(Reserva, reserva_id)
```

Usar siempre:

```python
select(Reserva).where(
    Reserva.id == reserva_id,
    Reserva.club_id == tenant.club.id,
)
```

Aplicar el filtro de club a:

```text
Reserva
Cancha
TurnoFijo
BloqueoPuntual
ConfiguracionClub
```

No aceptar `club_id` en schemas, query parameters ni URLs.

El backend debe asignarlo:

```python
reserva = Reserva(
    club_id=tenant.club.id,
    ...
)
```

Para entidades relacionadas, validar también la pertenencia:

```python
cancha = db.scalar(
    select(Cancha).where(
        Cancha.id == payload.cancha_id,
        Cancha.club_id == tenant.club.id,
    )
)
```

## Fase 8: Refactor de endpoints

### Públicos

Modificar:

```text
GET /api/canchas
GET /api/config
GET /api/disponibilidad
POST /api/reservas
```

Todos deben recibir el contexto de `get_public_tenant` y consultar usando `tenant.club.id`.

### Administrativos

Modificar:

```text
GET    /api/auth/me
GET    /api/reservas
GET    /api/reservas/pendientes/count
PATCH  /api/reservas/{id}/confirmar
PATCH  /api/reservas/{id}/cancelar
GET    /api/canchas/grilla
GET    /api/canchas/{id}/grilla
GET    /api/turnos-fijos
POST   /api/turnos-fijos
PATCH  /api/turnos-fijos/{id}
DELETE /api/turnos-fijos/{id}
GET    /api/bloqueos-puntuales
POST   /api/bloqueos-puntuales
DELETE /api/bloqueos-puntuales/{id}
PATCH  /api/config
```

Todos deben recibir `get_current_admin_tenant`.

## Fase 9: Refactor de `slots.py`

Modificar las firmas para recibir `club_id`:

```python
slots_del_dia(
    db,
    club_id,
    cancha_id,
    fecha,
)
```

También:

```python
get_configuracion(db, club_id)
grilla_de_dia(db, club_id, fecha)
```

Todas las búsquedas deben filtrar por `club_id`:

```python
select(Reserva).where(
    Reserva.club_id == club_id,
    Reserva.cancha_id == cancha_id,
    Reserva.fecha == fecha,
)
```

Aplicar lo mismo a reservas, bloqueos, turnos, canchas y configuración.

## Fase 10: Frontend

El frontend debe funcionar bajo cualquier hostname y continuar usando rutas relativas:

```text
/api/canchas
/api/disponibilidad
/api/reservas
```

No debe enviar `club_id`.

El backend obtiene el club desde el dominio para el flujo público.

Ante un `404` de tenant, mostrar:

```text
Este club no está disponible actualmente.
```

No diferenciar visualmente entre club inexistente, expirado o suspendido.

## Fase 11: Nginx y DNS

Configurar un registro wildcard:

```text
*.reservas-ya.com.ar
```

Nginx debe:

- Aceptar subdominios.
- Preservar `Host`.
- Enviar `/api` al backend.
- Servir la SPA para cualquier ruta.
- Mantener `/admin` dentro del hostname correspondiente.

En desarrollo se puede soportar un dominio configurable mediante:

```text
TENANT_BASE_DOMAIN=reservas-ya.com.ar
```

## Fase 12: Seguridad

Implementar:

- Rate limiting para login.
- Rate limiting para recuperación de contraseña.
- CORS limitado a los dominios de la plataforma.
- JWT de aproximadamente 60 minutos.
- Validación de suscripción en cada request.
- Invalidación de tokens de recuperación usados.
- Desactivación inmediata de administradores.
- Respuestas genéricas para tenants inexistentes o bloqueados.
- Swagger protegido o deshabilitado en producción.
- Logs sin contraseñas, tokens ni datos sensibles.
- Verificación de pertenencia para cada recurso.

## Fase 13: Tests obligatorios

### Tenancy público

- Hostname válido resuelve el club correcto.
- Hostname inexistente devuelve `404`.
- Dominio base sin subdominio devuelve `404`.
- Club inactivo devuelve `404`.
- Free dentro de los 14 días permite operar.
- Free vencido devuelve `404`.
- Club suspendido devuelve `404`.

### Tenancy administrativo

- Token del club A obtiene siempre el club A.
- Token del club A no puede leer reservas del club B.
- Token del club A no puede modificar reservas del club B.
- Token del club A no puede acceder a canchas del club B.
- Token del club A no puede cambiar configuración del club B.
- Cambiar el hostname no cambia el club del administrador.
- Un `club_id` enviado en el body no modifica el tenant utilizado.

### Suscripciones

- Suspender un club invalida inmediatamente un JWT previamente emitido.
- Expirar un Free invalida inmediatamente un JWT previamente emitido.
- Reactivar un club permite volver a iniciar sesión.
- Un club Básico activo no expira automáticamente.

### Reservas

- Dos clubes pueden reservar el mismo número de cancha sin conflicto.
- Dos reservas del mismo club no pueden ocupar el mismo slot.
- Un bloqueo de otro club no afecta la disponibilidad.
- Un turno fijo de otro club no afecta la disponibilidad.

## Fase 14: Orden exacto de implementación

1. Crear modelos `Club` y `ClubSuscripcion`.
2. Agregar `club_id` a `AdminUsuario`.
3. Crear migración inicial y migración de datos.
4. Agregar `club_id` a las tablas operativas.
5. Completar foreign keys, índices y restricciones.
6. Modificar `seed.py`.
7. Crear comando manual de alta de clubes.
8. Crear `tenant.py`.
9. Implementar `get_public_tenant`.
10. Implementar `get_current_admin_tenant`.
11. Modificar login.
12. Modificar `slots.py`.
13. Modificar endpoints públicos.
14. Modificar endpoints administrativos.
15. Eliminar usos de `db.get()` sin filtro de club.
16. Agregar validación de suscripción en login y requests.
17. Agregar tests de aislamiento.
18. Ejecutar migraciones sobre una copia de la base actual.
19. Adaptar frontend a errores `404`.
20. Configurar wildcard DNS/Nginx.
21. Probar con dos clubes.
22. Desplegar.

## Criterio de finalización

La primera etapa estará completa cuando:

- Se puedan crear dos clubes.
- Cada uno tenga su propio subdominio.
- Cada uno tenga su administrador.
- Cada club vea solamente sus canchas, configuración y reservas.
- Un administrador no pueda cruzar datos manipulando IDs.
- Un Free expirado reciba `404`.
- Un Básico activo opere sin límite de tiempo.
- Un token anterior deje de funcionar si el club se suspende.
- Las reservas públicas se creen solamente en el club determinado por el hostname.
- La base actual se haya migrado sin perder reservas ni configuración.
