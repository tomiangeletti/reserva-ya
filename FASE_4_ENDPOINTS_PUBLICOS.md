# Fase 4: Endpoints Públicos Multi-Tenant

## Objetivo

Los endpoints públicos resuelven el club desde el header `Host` mediante
`get_public_tenant`. El frontend no envía `club_id`.

Ejemplo:

```text
Host: club-prueba.reservas-ya.com.ar
```

La dependencia obtiene el club cuyo subdominio es `club-prueba` y lo expone
como `tenant.club`.

## Endpoints modificados

### `GET /api/canchas`

Archivo:

```text
backend/app/routers/canchas.py
```

Cambios:

- Agrega `tenant: PublicTenant = Depends(get_public_tenant)`.
- Filtra canchas activas por `tenant.club.id`.
- No consulta canchas de otros clubes.

Filtro aplicado:

```python
Cancha.activo.is_(True)
Cancha.club_id == tenant.club.id
```

### `GET /api/config`

Archivo:

```text
backend/app/routers/config.py
```

Cambios:

- Agrega `get_public_tenant`.
- Busca la configuración por `ConfiguracionClub.club_id`.
- Ya no utiliza la primera configuración global de la base.

### `GET /api/disponibilidad`

Archivo:

```text
backend/app/routers/disponibilidad.py
```

Cambios:

- Cambia `cancha_id` a `UUID`.
- Agrega `get_public_tenant`.
- Valida que la cancha pertenezca al club resuelto por hostname.
- Pasa `tenant.club.id` a `slots_del_dia`.

Una cancha de otro club responde:

```http
404 Not Found
```

### `POST /api/reservas`

Archivo:

```text
backend/app/routers/reservas.py
```

Cambios:

- Agrega `get_public_tenant`.
- Valida la cancha usando `cancha_id` y `tenant.club.id`.
- Busca la configuración del club correcto.
- Calcula disponibilidad usando datos del club correcto.
- Asigna `club_id=tenant.club.id` al crear la reserva.

El `club_id` no se recibe desde el body.

## Helpers modificados

Archivo:

```text
backend/app/slots.py
```

### `get_configuracion`

Ahora acepta opcionalmente:

```python
get_configuracion(db, club_id)
```

Cuando se proporciona `club_id`, filtra la configuración por club.

### `slots_del_dia`

Ahora acepta opcionalmente:

```python
slots_del_dia(db, cancha_id, fecha, club_id=club_id)
```

Cuando se proporciona `club_id`, filtra por club:

- Reservas.
- Bloqueos puntuales.
- Turnos fijos.
- Configuración.

El parámetro es opcional temporalmente para no romper todavía los endpoints
administrativos que aún no fueron migrados al contexto administrativo.

## Tenant resolver

Archivo:

```text
backend/app/tenant.py
```

La resolución pública:

1. Lee `request.url.hostname`.
2. Valida el dominio base `reservas-ya.com.ar`.
3. Extrae el subdominio.
4. Busca `Club` y `ClubSuscripcion`.
5. Rechaza clubes inexistentes o inactivos con `404`.

## Endpoints todavía no incluidos

Esta etapa no modifica todavía:

- `POST /api/auth/login`.
- `POST /api/auth/forgot-password`.
- `POST /api/auth/password/reset`.
- Endpoints administrativos.
- Chequeo de estados `TRIAL`, `ACTIVO`, `EXPIRADO` y `SUSPENDIDO`.

Esos cambios corresponden a la integración de autenticación administrativa y
validación de suscripción.

## Pruebas manuales

```powershell
curl.exe `
  -i `
  -H "Host: club-prueba.reservas-ya.com.ar" `
  http://localhost:8000/api/canchas
```

```powershell
curl.exe `
  -i `
  -H "Host: el-tunel.reservas-ya.com.ar" `
  http://localhost:8000/api/canchas
```

Para disponibilidad se necesita un UUID de cancha perteneciente al club:

```powershell
curl.exe `
  -i `
  -H "Host: club-prueba.reservas-ya.com.ar" `
  "http://localhost:8000/api/disponibilidad?cancha_id=<UUID>&fecha=2026-08-20"
```

## Nota de seguridad

El hostname determina el tenant solamente para endpoints públicos. El
`club_id` del body, query string o URL no se usa como fuente de autorización.
