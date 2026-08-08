# Seguridad

No reportes vulnerabilidades públicamente en Issues. Enviá los detalles al
equipo mantenedor del proyecto para coordinar una corrección antes de
publicarlos.

Nunca incluyas en un issue o pull request:

- archivos `.env` o credenciales reales;
- contraseñas, tokens JWT o claves privadas;
- datos personales de clientes o reservas reales.

Antes de desplegar, reemplazá `JWT_SECRET`, `ADMIN_PASSWORD` y la contraseña de
PostgreSQL por valores generados y exclusivos del entorno.
