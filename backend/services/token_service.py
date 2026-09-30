from datetime import date
from database.models import db, Token, Appointment


def generate_token(appointment: Appointment) -> Token:
    """Create the next sequential token for the appointment's department, today."""
    dept_code = appointment.department.code
    today = date.today().isoformat()

    count = Token.query.filter_by(department_id=appointment.department_id, token_date=today).count()
    token_number = f"{dept_code[0]}-{count + 1:03d}"

    token = Token(
        appointment_id=appointment.id,
        department_id=appointment.department_id,
        token_number=token_number,
        token_date=today,
        status="WAITING",
    )
    db.session.add(token)
    db.session.commit()
    return token


def call_next(department_id: int):
    """Mark the current IN_PROGRESS token (if any) COMPLETED and call the next WAITING token."""
    from datetime import datetime
    today = date.today().isoformat()

    current = Token.query.filter_by(
        department_id=department_id, token_date=today, status="IN_PROGRESS"
    ).first()
    if current:
        current.status = "COMPLETED"
        current.completed_at = datetime.utcnow()
        appt = Appointment.query.get(current.appointment_id)
        if appt:
            appt.status = "COMPLETED"
            appt.completed_at = datetime.utcnow()

    next_token = Token.query.filter_by(
        department_id=department_id, token_date=today, status="WAITING"
    ).order_by(Token.created_at.asc()).first()
    if next_token:
        next_token.status = "IN_PROGRESS"
        next_token.called_at = datetime.utcnow()

    db.session.commit()
    return next_token
