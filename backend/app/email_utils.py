from html import escape

import resend

from .config import settings


resend.api_key = settings.resend_api_key

FROM_ADDRESS = "no-reply@reservas-ya.com.ar"  # hasta que verifiques tu dominio propio en Resend
BRAND_URL = "https://www.reservas-ya.com.ar"
LOGO_URL = f"{BRAND_URL}/favicon-ry.svg"


def send_reset_email(to_email: str, token: str) -> None:
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    safe_reset_link = escape(reset_link, quote=True)

    resend.Emails.send({
        "from": FROM_ADDRESS,
        "to": to_email,
        "subject": "Tu nueva contraseña en Reservas Ya",
        "html": f"""
            <!doctype html>
            <html lang="es">
              <body style="margin:0; padding:0; background-color:#0f1214; color:#aab4bd; font-family:Arial, Helvetica, sans-serif;">
                <div style="display:none; max-height:0; overflow:hidden; opacity:0;">Elegí una nueva contraseña para volver a tu panel.</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0f1214;">
                  <tr>
                    <td align="center" style="padding:40px 16px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
                        <tr>
                          <td style="padding:0 0 22px 4px;">
                            <a href="{BRAND_URL}" style="color:#eef2f5; text-decoration:none;">
                              <img src="{LOGO_URL}" width="32" height="32" alt="Reservas Ya" style="display:inline-block; vertical-align:middle; border:0; border-radius:10px;">
                              <span style="display:inline-block; vertical-align:middle; margin-left:9px; color:#eef2f5; font-size:17px; font-weight:bold; letter-spacing:-0.3px;">reservasya</span>
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:40px 36px 36px; background-color:#171c20; border:1px solid #272e33; border-radius:16px;">
                            <p style="margin:0 0 18px; color:#3b82f6; font-size:11px; font-weight:bold; letter-spacing:2px; text-transform:uppercase;">Acceso seguro</p>
                            <h1 style="margin:0 0 14px; color:#eef2f5; font-size:29px; line-height:1.15; letter-spacing:-0.8px;">Volvamos a ordenar el día.</h1>
                            <p style="margin:0 0 28px; color:#aab4bd; font-size:15px; line-height:1.6;">Recibimos un pedido para cambiar la contraseña de tu cuenta de Reservas Ya. Hacé click en el botón para elegir una nueva.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="border-radius:8px; background-color:#2266ff;">
                                  <a href="{safe_reset_link}" style="display:inline-block; padding:13px 20px; border:1px solid #2266ff; border-radius:8px; color:#ffffff; font-size:14px; font-weight:bold; text-decoration:none;">Crear nueva contraseña&nbsp; →</a>
                                </td>
                              </tr>
                            </table>
                            <p style="margin:26px 0 0; color:#6f7b85; font-size:12px; line-height:1.6;">Este enlace vence en 10 minutos y solo puede usarse una vez.</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:22px 4px 0; color:#6f7b85; font-size:12px; line-height:1.6;">
                            <p style="margin:0 0 10px;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
                            <p style="margin:0; word-break:break-all;"><a href="{safe_reset_link}" style="color:#60a5fa; text-decoration:underline;">{safe_reset_link}</a></p>
                            <p style="margin:20px 0 0;">Si no pediste este cambio, podés ignorar este mensaje. Tu contraseña no se modificará.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
        """,
    })
