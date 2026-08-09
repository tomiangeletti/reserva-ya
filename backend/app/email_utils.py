import resend

from .config import settings


resend.api_key = settings.resend_api_key

FROM_ADDRESS = "onboarding@resend.dev"  # hasta que verifiques tu dominio propio en Resend


def send_reset_email(to_email: str, token: str) -> None:
    reset_link = f"http://localhost:5173/reset-password?token={token}"

    resend.Emails.send({
        "from": FROM_ADDRESS,
        "to": to_email,
        "subject": "Restablecé tu contraseña",
        "html": f"""
            <p>Recibimos un pedido para restablecer tu contraseña.</p>
            <p><a href="{reset_link}">Hacé click acá para elegir una nueva contraseña</a></p>
            <p>Este link expira en 10 minutos. Si no pediste esto, ignorá este mail.</p>
        """,
    })