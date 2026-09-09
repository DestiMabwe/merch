"""Notification abstraction: "send an order notification."

`ConsoleNotifier` (log the message) is the only implementation needed for
local dev today. `SmtpNotifier` is used automatically once SMTP_HOST is
configured. A future "paid" or "collected" notification is an additive
method on `Notifier`, not a rewrite of this interface.
"""

import os
import smtplib
from email.message import EmailMessage

from app.models import Order

FROM_EMAIL = os.environ.get("NOTIFICATIONS_FROM_EMAIL", "no-reply@campmerch.local")
SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")

_BANK_DETAILS = (
    "Bank: Capitec\n"
    "Account Type: Savings Account\n"
    "Account Number: 2467898187\n"
    "Branch Code: 470010"
)


def _order_confirmation_body(order: Order) -> str:
    lines = [f"Thanks for your order, {order.customer_name}!", "", f"Reference: {order.reference}", ""]
    total = 0
    for item in order.items:
        variant = " / ".join(part for part in (item.variant_size, item.variant_color) if part)
        variant = variant or "One size"
        line_total = item.unit_price * item.quantity
        total += line_total
        lines.append(f"- {item.product_name} ({variant}) x{item.quantity} - R{line_total}")
    payment_reference = f"{order.customer_name} Merch"
    lines += [
        "",
        f"Total: R{total}",
        "",
        f'Pay by EFT using the details below, and use "{payment_reference}" as the payment '
        "description so we can match it to you:",
        _BANK_DETAILS,
        f"Reference: {payment_reference}",
        "",
        "Collect from Forward In Faith Ministries Int., 7 Spencer Road, Maitland; no shipping.",
    ]
    return "\n".join(lines)


class Notifier:
    def send_order_confirmation(self, order: Order) -> None:
        raise NotImplementedError


class ConsoleNotifier(Notifier):
    def send_order_confirmation(self, order: Order) -> None:
        if not order.customer_email:
            return
        print(f"----- order confirmation email to {order.customer_email} -----")
        print(_order_confirmation_body(order))
        print("-----")


class SmtpNotifier(Notifier):
    def send_order_confirmation(self, order: Order) -> None:
        if not order.customer_email:
            return

        message = EmailMessage()
        message["Subject"] = f"Order confirmation - {order.reference}"
        message["From"] = FROM_EMAIL
        message["To"] = order.customer_email
        message.set_content(_order_confirmation_body(order))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            if SMTP_USER and SMTP_PASSWORD:
                smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.send_message(message)


def get_notifier() -> Notifier:
    return SmtpNotifier() if SMTP_HOST else ConsoleNotifier()
