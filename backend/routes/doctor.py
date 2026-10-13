from datetime import datetime, date
from flask import Blueprint, request, jsonify
from routes.notifications import create_notification
from flask_login import login_required, current_user
from database.models import db, Doctor, Appointment, Token
from services.token_service import generate_token, call_next

import json

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
        "patient_id": a.patient_id,
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

    # Token generate karo
    token = generate_token(a)

    # Notify patient
    create_notification(
        a.patient.user_id,
        f"Your appointment with {doctor.user.name} on {a.appointment_date} at {a.appointment_time} is confirmed. Token: {token.token_number}",
        "appointment_approved",
    )
    db.session.commit()

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

    data = request.get_json() or {}
    reason = (data.get("reason") or "").strip()

    a.status = "REJECTED"
    if reason:
        a.notes = f"Rejected: {reason}"
    db.session.commit()

    # Notify patient
    reason_text = f" Reason: {reason}" if reason else ""
    create_notification(
        a.patient.user_id,
        f"Your appointment with {doctor.user.name} on {a.appointment_date} at {a.appointment_time} was not approved.{reason_text}",
        "appointment_rejected",
    )
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

    # Notify patient
    create_notification(
        a.patient.user_id,
        f"Your appointment with {doctor.user.name} on {a.appointment_date} has been completed. Thank you for visiting.",
        "appointment_completed",
    )
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


@bp.get("/patients/<int:patient_id>")
@login_required
def patient_detail(patient_id):
    """Full patient profile for the doctor — medical info + appointment history."""
    doctor = require_doctor()
    if not doctor:
        return jsonify(success=False, error="Only doctors can view this"), 403

    from database.models import Patient

    p = Patient.query.get_or_404(patient_id)
    user = p.user

    appts = (
        Appointment.query.filter_by(doctor_id=doctor.id, patient_id=patient_id)
        .order_by(Appointment.created_at.desc())
        .all()
    )

    age = None
    if p.date_of_birth:
        try:
            dob = datetime.strptime(p.date_of_birth, "%Y-%m-%d").date()
            today = date.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        except (ValueError, TypeError):
            age = None

    return jsonify(
        success=True,
        patient={
            "id": p.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "date_of_birth": p.date_of_birth,
            "age": age,
            "gender": p.gender,
            "address": p.address,
            "blood_group": p.blood_group,
            "emergency_contact": p.emergency_contact,
            "total_visits": len(appts),
            "last_visit": appts[0].appointment_date if appts else None,
            "appointments": [
                {
                    "id": a.id,
                    "appointment_date": a.appointment_date,
                    "date": a.appointment_date,
                    "time": a.appointment_time,
                    "reason": a.reason,
                    "status": a.status,
                    "department": a.department.name if a.department else None,
                }
                for a in appts
            ],
        },
    )


@bp.post("/appointments/<int:appt_id>/prescription")
@login_required
def save_prescription(appt_id):
    """Create or update a prescription for an appointment."""
    doctor = require_doctor()
    if not doctor:
        return jsonify(success=False, error="Only doctors can write prescriptions"), 403

    a = Appointment.query.get_or_404(appt_id)
    if a.doctor_id != doctor.id:
        return jsonify(success=False, error="Not authorized"), 403

    if a.status not in ("APPROVED", "COMPLETED"):
        return jsonify(success=False, error="Prescription can only be written for approved or completed appointments"), 400

    data = request.get_json() or {}
    medicines = data.get("medicines") or []

    if not data.get("diagnosis", "").strip():
        return jsonify(success=False, error="Diagnosis is required"), 400
    if not medicines or not any(m.get("name", "").strip() for m in medicines):
        return jsonify(success=False, error="At least one medicine is required"), 400

    from database.models import Prescription

    rx = Prescription.query.filter_by(appointment_id=appt_id).first()
    is_new = False
    if not rx:
        rx = Prescription(
            appointment_id=appt_id,
            doctor_id=doctor.id,
            patient_id=a.patient_id,
        )
        db.session.add(rx)
        is_new = True

    rx.diagnosis = data["diagnosis"].strip()
    rx.medicines = json.dumps([
        {
            "name": (m.get("name") or "").strip(),
            "dosage": (m.get("dosage") or "").strip(),
            "duration": (m.get("duration") or "").strip(),
            "notes": (m.get("notes") or "").strip(),
        }
        for m in medicines
        if (m.get("name") or "").strip()
    ])
    rx.advice = (data.get("advice") or "").strip() or None
    rx.follow_up_date = (data.get("follow_up_date") or "").strip() or None

    db.session.commit()

    # Notify patient only when prescription is NEWLY created (not on every edit)
    if is_new:
        create_notification(
            a.patient.user_id,
            f"Prescription from {doctor.user.name} is ready for your appointment on {a.appointment_date}. Click to view.",
            "prescription_ready",
        )
        db.session.commit()

    return jsonify(success=True, prescription_id=rx.id)


@bp.get("/appointments/<int:appt_id>/prescription")
@login_required
def get_prescription_doctor(appt_id):
    """Doctor reads a prescription they wrote."""
    doctor = require_doctor()
    if not doctor:
        return jsonify(success=False, error="Only doctors can view this"), 403

    a = Appointment.query.get_or_404(appt_id)
    if a.doctor_id != doctor.id:
        return jsonify(success=False, error="Not authorized"), 403

    from database.models import Prescription

    rx = Prescription.query.filter_by(appointment_id=appt_id).first()
    if not rx:
        return jsonify(success=True, prescription=None)

    try:
        meds = json.loads(rx.medicines or "[]")
    except (ValueError, TypeError):
        meds = []

    return jsonify(
        success=True,
        prescription={
            "id": rx.id,
            "diagnosis": rx.diagnosis,
            "medicines": meds,
            "advice": rx.advice,
            "follow_up_date": rx.follow_up_date,
            "created_at": rx.created_at.isoformat() if rx.created_at else None,
            "doctor_name": doctor.user.name,
            "doctor_qualification": doctor.qualification,
            "doctor_specialization": doctor.specialization,
            "patient_name": a.patient.user.name,
            "appointment_date": a.appointment_date,
            "appointment_time": a.appointment_time,
        },
    )