import threading
from flask_mail import Message
from flask import current_app
from app import mail

def _send_role_decision_task(app, to_email, approved: bool, reason: str | None):
    with app.app_context():
        subject = "Odluka o zahtevu za ulogu autora"
        msg = Message(subject, recipients=[to_email])

        if approved:
            msg.body = (
                "Vaš zahtev za ulogu autora je ODOBREN.\n\n"
                "Sada možete da objavljujete recepte.\n\n"
                "Pozdrav,\nRecepti platforma"
            )
        else:
            msg.body = (
                "Vaš zahtev za ulogu autora je ODBIJEN.\n\n"
                f"Razlog: {reason or 'Nije naveden'}\n\n"
                "Pozdrav,\nRecepti platforma"
            )

        mail.send(msg)

def send_role_email(to_email: str, approved: bool, reason: str | None = None):
    # current_app je proxy, uzmi pravi app objekat
    app = current_app._get_current_object()
    t = threading.Thread(target=_send_role_decision_task, args=(app, to_email, approved, reason))
    t.start()

def _comment_task(app, to_email: str, commenter_name: str, recipe_title: str, comment_text: str):
    with app.app_context():
        msg = Message(
            "Novi komentar na vaš recept",
            recipients=[to_email],
        )
        msg.body = (
            f"Korisnik: {commenter_name}\n"
            f"Recept: {recipe_title}\n\n"
            f"Komentar:\n{comment_text}\n"
        )
        mail.send(msg)

def send_comment_email(to_email: str, commenter_name: str, recipe_title: str, comment_text: str):
    app = current_app._get_current_object()
    threading.Thread(
        target=_comment_task,
        args=(app, to_email, commenter_name, recipe_title, comment_text)
    ).start()