from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from database.models import db, Patient, Doctor, Appointment, Token

bp = Blueprint("patient", __name__, url_prefix="/api/appointments")


def require_patient():
    if current_user.role != "PATIENT":
        return None
    return Patient.query.filter_by(user_id=current_user.id).first()


def appointment_to_dict(a: Appointment):
    token = Token.query.filter_by(appointment_id=a.id).first()
    return {
        "id": a.id, "department": a.department.name, "doctor": a.doctor.user.name,
        "date": a.appointment_date, "time": a.appointment_time, "reason": a.reason,
        "status": a.status, "token": token.token_number if token else None,
        "token_status": token.status if token else None,
    }


@bp.get("/doctors")
@login_required
def list_doctors():
    doctors = (
        Doctor.query.filter_by(is_available=True)
        .order_by(Doctor.department_id, Doctor.id)
        .all()
    )
    return jsonify(
        success=True,
        doctors=[
            {
                "id": d.id,
                "name": d.user.name,
                "department": d.department.name,
                "department_id": d.department_id,
                "specialization": d.specialization,
                "qualification": d.qualification,
                "experience": d.experience,
                "room": d.room_number,
                "photo_url": d.photo_url,
                "fees": d.fees,
                "rating": d.rating,
                "review_count": d.review_count,
                "consultation_duration": d.consultation_duration,
                "bio": d.bio,
                "languages": d.languages,
            }
            for d in doctors
        ],
    )


@bp.post("")
@login_required
def create_appointment():
    patient = require_patient()
    if not patient:
        return jsonify(success=False, error="Only patients can book appointments"), 403

    data = request.get_json(silent=True) or {}
    doctor = Doctor.query.get(data.get("doctor_id"))
    date_ = (data.get("date") or "").strip()
    time_ = (data.get("time") or "").strip()
    reason = (data.get("reason") or "").strip()

    if not doctor or not doctor.is_available:
        return jsonify(success=False, error="Doctor unavailable"), 400
    if not date_ or not time_ or not reason:
        return jsonify(success=False, error="Doctor, date, time and reason are required"), 400
    if len(reason) > 255:
        return jsonify(success=False, error="Reason is too long"), 400

    try:
        appointment_dt = datetime.strptime(f"{date_} {time_}", "%Y-%m-%d %H:%M")
    except ValueError:
        return jsonify(success=False, error="Use a valid date and time"), 400
    if appointment_dt < datetime.now():
        return jsonify(success=False, error="Please choose a future appointment time"), 400

    conflict = Appointment.query.filter_by(
        doctor_id=doctor.id, appointment_date=date_, appointment_time=time_
    ).filter(Appointment.status.in_(["PENDING", "APPROVED"])).first()
    if conflict:
        return jsonify(success=False, error="This time slot is unavailable. Please select another time."), 409

    appt = Appointment(
        patient_id=patient.id, doctor_id=doctor.id, department_id=doctor.department_id,
        appointment_date=date_, appointment_time=time_, reason=reason,
        notes=data.get("notes", ""), status="PENDING",
    )
    db.session.add(appt)
    db.session.commit()
    return jsonify(success=True, appointment=appointment_to_dict(appt))


@bp.get("")
@login_required
def list_appointments():
    patient = require_patient()
    if not patient:
        return jsonify(success=False, error="Only patients can view this"), 403
    appts = Appointment.query.filter_by(patient_id=patient.id).order_by(Appointment.created_at.desc()).all()
    return jsonify(success=True, appointments=[appointment_to_dict(a) for a in appts])


@bp.get("/history")
@login_required
def history():
    patient = require_patient()
    if not patient:
        return jsonify(success=False, error="Only patients can view this"), 403
    appts = Appointment.query.filter_by(patient_id=patient.id).filter(
        Appointment.status.in_(["COMPLETED", "REJECTED"])
    ).order_by(Appointment.created_at.desc()).all()
    return jsonify(success=True, appointments=[appointment_to_dict(a) for a in appts])


@bp.get("/<int:appt_id>")
@login_required
def get_appointment(appt_id):
    a = Appointment.query.get_or_404(appt_id)
    if current_user.role == "PATIENT":
        patient = require_patient()
        if not patient or a.patient_id != patient.id:
            return jsonify(success=False, error="Not authorized"), 403
    elif current_user.role == "DOCTOR":
        doctor = Doctor.query.filter_by(user_id=current_user.id).first()
        if not doctor or a.doctor_id != doctor.id:
            return jsonify(success=False, error="Not authorized"), 403
    elif current_user.role != "ADMIN":
        return jsonify(success=False, error="Not authorized"), 403
    return jsonify(success=True, appointment=appointment_to_dict(a))


@bp.get("/doctors/<int:doctor_id>/slots")
@login_required
def doctor_slots(doctor_id):
    """Return booked slots for a doctor on a given date."""
    date_ = (request.args.get("date") or "").strip()
    if not date_:
        return jsonify(success=False, error="date is required"), 400

    booked = (
        Appointment.query.filter_by(
            doctor_id=doctor_id,
            appointment_date=date_,
        )
        .filter(Appointment.status.in_(["PENDING", "APPROVED"]))
        .all()
    )
    booked_times = [a.appointment_time for a in booked]
    return jsonify(success=True, booked=booked_times)

@bp.delete("/<int:appointment_id>")
@login_required
def cancel_appointment(appointment_id):
    patient = require_patient()
    if not patient:
        return jsonify(success=False, error="Patient only"), 403

    appt = Appointment.query.filter_by(
        id=appointment_id,
        patient_id=patient.id,
    ).first()

    if not appt:
        return jsonify(success=False, error="Appointment not found"), 404

    if appt.status not in ("PENDING", "APPROVED"):
        return jsonify(
            success=False,
            error="Only pending or approved appointments can be cancelled",
        ), 400

    appt.status = "CANCELLED"
    db.session.commit()
    return jsonify(success=True)


import json


@bp.get("/<int:appointment_id>/prescription")
@login_required
def get_prescription_patient(appointment_id):
    """Patient reads their own prescription."""
    patient = require_patient()
    if not patient:
        return jsonify(success=False, error="Patient access only"), 403

    a = Appointment.query.filter_by(
        id=appointment_id, patient_id=patient.id
    ).first()
    if not a:
        return jsonify(success=False, error="Appointment not found"), 404

    from database.models import Prescription

    rx = Prescription.query.filter_by(appointment_id=appointment_id).first()
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
            "doctor_name": rx.doctor.user.name if rx.doctor else None,
            "doctor_qualification": rx.doctor.qualification if rx.doctor else None,
            "doctor_specialization": rx.doctor.specialization if rx.doctor else None,
            "patient_name": patient.user.name,
            "appointment_date": a.appointment_date,
            "appointment_time": a.appointment_time,
        },
    )