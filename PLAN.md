# El Túnel — Sistema de Reservas Online
### Plan de desarrollo v1

---

## 1. Resumen del proyecto

Sistema de reservas online para un club con 3 canchas de padel, con turnos de **duración fija de 1 hora y media**. Dos superficies:

- **Usuario** (`eltunel.com.ar/reservar`): app pública, mobile-first, sin necesidad de cuenta. Elige día → cancha → horario → deja seña por transferencia → la reserva queda **pendiente** hasta que el club la confirma por WhatsApp.
- **Administración** (`administracion.eltunel.com.ar`): panel privado (login), desktop-only, donde el club gestiona reservas y disponibilidad de canchas.

## 2. Alcance v1 vs. futuro

**Incluido en v1:**
- Reserva sin cuenta de usuario (solo nombre + WhatsApp).
- Un solo usuario administrador (login simple, sin roles).
- Señal visual en el panel (badge/contador) para nuevas reservas pendientes — sin notificaciones push ni email.
- Liberación automática de turnos pendientes no confirmados (timeout).

**Fuera de alcance v1 (dejar la base preparada, no construir ahora):**
- Cuentas de usuario / historial de reservas del cliente.
- Múltiples usuarios admin con roles y permisos.
- Notificaciones push/email/sonido.
- Pagos online (todo sigue siendo transferencia + confirmación manual).
- Reportes de ocupación/ingresos.

## 3. Reglas de negocio clave

| Regla | Definición |
|---|---|
| **Duración de turno** | Fija, 1 hora y media, igual para todas las canchas. |
| **Timeout de reserva pendiente** | Si el usuario reserva y no se confirma la seña en **30 minutos**, la reserva pasa a `EXPIRADA` y el horario se libera automáticamente. |
| **Estados de una reserva** | `PENDIENTE` → `CONFIRMADA` (admin confirma seña) / `EXPIRADA` (venció el timeout) / `CANCELADA` (opcional, cancelación manual desde el panel). |
| **Slots bloqueados sin reserva de por medio** | El admin puede marcar un horario como ocupado por dos motivos: **turno fijo** (recurrente, mismo día de la semana y hora todas las semanas) o **ocupado puntual** (reserva hecha por WhatsApp, aplica a una fecha/hora específica). Ambos se pueden liberar manualmente. |
| **Disponibilidad mostrada al usuario** | Un horario aparece disponible si **no** existe: una reserva activa (`PENDIENTE` o `CONFIRMADA`) para ese slot, ni un turno fijo que aplique a ese día de la semana/hora, ni un bloqueo puntual para esa fecha/hora. |
| **Concurrencia** | Evitar doble reserva del mismo slot con una restricción única en base de datos (cancha + fecha + hora), no solo validación en el backend. |

## 4. Flujo de usuario (mobile-first)

1. **Elegir turno** — `eltunel.com.ar/reservar`
   - Selector de día (próximos ~14 días).
   - Selector de cancha (2-3 tabs).
   - Grilla de horarios disponibles para ese día/cancha (1 hora cada uno).
2. **Confirmar y señar**
   - Resumen: cancha, día, hora, precio.
   - Dirección del club.
   - Monto de la seña + alias para transferir.
   - Formulario: nombre y apellido, WhatsApp.
   - Al confirmar → se crea la reserva en estado `PENDIENTE` y arranca el timeout de 30 min.
3. **Reserva pendiente**
   - Mensaje claro: "la reserva no está confirmada hasta que el club reciba la transferencia".
   - Botón que abre WhatsApp (`wa.me`) con mensaje prellenado para mandar el comprobante.

## 5. Flujo de administración (desktop)

1. **Login** — `administracion.eltunel.com.ar` (usuario único, JWT o sesión simple).
2. **Panel de reservas**
   - Filtros: Hoy / Próximos días / Todas.
   - Búsqueda por nombre.
   - Tabla: hora, cancha, cliente, teléfono, estado.
   - Acción "Confirmar seña" sobre reservas `PENDIENTE` → pasa a `CONFIRMADA`.
   - Señal de reservas nuevas: **badge con contador** en el ítem de menú "Reservas" (alcanza con esto en v1, sin sonido ni push).
3. **Canchas y turnos**
   - Vista tipo grilla (cancha x horario) para un día elegido.
   - Click en una celda libre → marcar como **turno fijo** (recurrente) u **ocupado puntual** (reserva por WhatsApp).
   - Click en una celda ocupada manualmente → liberar turno.
   - Las reservas confirmadas/pendientes se ven en la misma grilla pero no se pueden liberar desde acá (se gestionan desde el panel de reservas).

## 6. Modelo de datos (PostgreSQL)

```
canchas
  id, nombre, activo

turnos_fijos                -- bloqueos recurrentes semanales
  id, cancha_id, dia_semana (0-6), hora_inicio, activo

bloqueos_puntuales           -- ocupado por WhatsApp u otro motivo manual, fecha específica
  id, cancha_id, fecha, hora_inicio, motivo, creado_por

reservas
  id, cancha_id, fecha, hora_inicio,
  nombre_cliente, telefono_cliente,
  precio_cancha, monto_senia,
  estado (PENDIENTE | CONFIRMADA | EXPIRADA | CANCELADA),
  creado_en, expira_en, confirmado_en

admin_usuario
  id, email, password_hash        -- un solo registro en v1

configuracion_club
  direccion, alias_transferencia, precio_cancha_default, monto_senia_default,
  hora_apertura, hora_cierre
```

> Restricción única recomendada: `(cancha_id, fecha, hora_inicio)` en `reservas` para estados activos (`PENDIENTE`, `CONFIRMADA`), y también contra `bloqueos_puntuales` y `turnos_fijos`, para que no puedan coexistir dos ocupaciones del mismo slot.

## 7. Backend — FastAPI

**Endpoints públicos (usuario):**
- `GET /canchas` — lista de canchas activas.
- `GET /disponibilidad?cancha_id&fecha` — horarios disponibles/ocupados para ese día (resuelve reservas activas + turnos fijos + bloqueos puntuales).
- `POST /reservas` — crea reserva en `PENDIENTE`, calcula `expira_en` (+30 min).

**Endpoints privados (admin, requieren auth):**
- `POST /auth/login`
- `GET /reservas?filtro=hoy|proximas|todas&busqueda=`
- `PATCH /reservas/{id}/confirmar`
- `PATCH /reservas/{id}/cancelar`
- `GET /canchas/{id}/grilla?fecha=` — estado de cada slot del día (libre, pendiente, confirmada, turno fijo, bloqueo puntual).
- `POST /turnos-fijos`, `DELETE /turnos-fijos/{id}`
- `POST /bloqueos-puntuales`, `DELETE /bloqueos-puntuales/{id}`
- `GET /reservas/pendientes/count` — para el badge del sidebar (polling simple cada X segundos alcanza en v1).

**Tarea de expiración de reservas pendientes:**
- Job periódico (cada 1-2 min) que busca reservas `PENDIENTE` con `expira_en < ahora` y las pasa a `EXPIRADA`. Puede ser un scheduler simple (APScheduler) corriendo junto al backend, sin necesidad de infraestructura extra en v1.

## 8. Frontend — React + Vite

- **App usuario**: build separado o ruta pública, sin autenticación, optimizado para mobile (test en viewport chico primero).
- **App/admin**: ruta o build separado detrás de login, pensado solo para desktop.
- Ambas consumen la misma API FastAPI.
- Estado de disponibilidad se refresca al entrar a la pantalla de horarios (y opcionalmente con un polling corto para evitar mostrar un slot que se acaba de ocupar).

## 9. Infraestructura / dominios

- `eltunel.com.ar/reservar` → frontend usuario.
- `administracion.eltunel.com.ar` → frontend admin, login obligatorio antes de cualquier dato.
- Backend FastAPI puede vivir en un solo servicio sirviendo ambas apps (rutas `/api/publico/*` y `/api/admin/*` separadas por permisos), o como API única consumida por los dos frontends — a definir con opencode según cómo se quiera desplegar.

## 10. Orden sugerido de desarrollo

1. Modelos de datos + migraciones (canchas, reservas, turnos_fijos, bloqueos_puntuales, admin_usuario, configuracion_club).
2. Endpoint de disponibilidad + creación de reserva (con restricción de concurrencia).
3. Job de expiración de reservas pendientes (30 min).
4. Frontend usuario: flujo de 3 pasos (elegir turno → confirmar y señar → pendiente/WhatsApp).
5. Auth admin simple (un solo usuario).
6. Panel de reservas (listado, filtros, confirmar seña) + badge de pendientes.
7. Grilla de canchas y turnos (marcar/liberar turno fijo y bloqueo puntual).
8. Pulido responsive del flujo usuario en celular real.

---