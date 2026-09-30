from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from database.models import db, Doctor, Appointment, Token
from services.token_service import generate_token, call_next

bp = Blueprint("doctor", __name__, url_prefix="/api/doctor")


def require_doctor():
    if current_user.role != "DOCTOR":
        return None
    return Doctor.query.filter_by(user_id=current_user.id).first()


@bp.get("/appointments")
@login_required
def doctor_appointments():
    doctor = require_doctor()
    if not doctor:
        return jsonify(success=False, error="Only doctors can view this"), 403
    status = request.args.get("status")
    q = Appointment.query.filter_by(doctor_id=doctor.id)
    if status:
        q = q.filter_by(status=status)
    appts = q.order_by(Appointment.created_at.desc()).all()
    return jsonify(success=True, appointments=[{
        "id": a.id,
        "patient": a.patient.user.name,
        "date": a.appointment_date,
        "time": a.appointment_time,
        "reason": a.reason,
        "status": a.status,
        "department": a.department.name if a.department else doctor.department.name,
        "token": next((t.token_number for t in Token.query.filter_by(appointment_id=a.id).order_by(Token.created_at.desc()).all()), None),
    } for a in appts], doctor={
        "name": doctor.user.name,
        "department": doctor.department.name if doctor.department else "Hospital",
        "specialization": doctor.specialization,
        "room": doctor.room_number,
    })


@bp.post("/appointments/<int:appt_id>/approve")
@login_required
def approve(appt_id):
    doctor = require_doctor()
    a = Appointment.query.get_or_404(appt_id)
    if not doctor or a.doctor_id != doctor.id:
        return jsonify(success=False, error="Not authorized"), 403
    if a.status != "PENDING":
        return jsonify(success=False, error="Appointment is not pending"), 400

    a.status = "APPROVED"
    a.approved_at = datetime.utcnow()
    db.session.commit()
    token = generate_token(a)
    return jsonify(success=True, status=a.status, token=token.token_number)


@bp.post("/appointments/<int:appt_id>/reject")
@login_required
def reject(appt_id):
    doctor = require_doctor()
    a = Appointment.query.get_or_404(appt_id)
    if not doctor or a.doctor_id != doctor.id:
        return jsonify(success=False, error="Not authorized"), 403
    if a.status != "PENDING":
        return jsonify(success=False, error="Appointment is not pending"), 400

    a.status = "REJECTED"
    db.session.commit()
    return jsonify(success=True, status=a.status)


@bp.post("/appointments/<int:appt_id>/complete")
@login_required
def complete(appt_id):
    doctor = require_doctor()
    a = Appointment.query.get_or_404(appt_id)
    if not doctor or a.doctor_id != doctor.id:
        return jsonify(success=False, error="Not authorized"), 403
    a.status = "COMPLETED"
    a.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify(success=True, status=a.status)


@bp.post("/token/next")
@login_required
def token_next():
    doctor = require_doctor()
    if not doctor:
        return jsonify(success=False, error="Only doctors can call tokens"), 403
    token = call_next(doctor.department_id)
    return jsonify(success=True, current_token=token.token_number if token else None)


@bp.get("/queue")
@login_required
def queue():
    doctor = require_doctor()
    if not doctor:
        return jsonify(success=False, error="Only doctors can view this"), 403
    today = date.today().isoformat()
    tokens = Token.query.filter_by(department_id=doctor.department_id, token_date=today).all()
    return jsonify(success=True, tokens=[{
        "token_number": t.token_number,
        "status": t.status,
        "patient": t.appointment.patient.user.name if t.appointment and t.appointment.patient and t.appointment.patient.user else "Patient",
        "appointment_id": t.appointment_id,
    } for t in tokens])
