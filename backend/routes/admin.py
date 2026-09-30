from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from database.models import db, User, Doctor, Patient, Department, Appointment, Token

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def require_admin():
    return current_user.role == "ADMIN"


def deny():
    return jsonify(success=False, error="Admin only"), 403


def user_dict(u):
    return {"id": u.id, "name": u.name, "email": u.email, "phone": u.phone, "role": u.role, "active": u.is_active_flag}


def patient_dict(p):
    return {"id": p.id, "user_id": p.user_id, "name": p.user.name, "email": p.user.email,
            "phone": p.user.phone, "gender": p.gender, "date_of_birth": p.date_of_birth,
            "blood_group": p.blood_group, "active": p.user.is_active_flag}


def doctor_dict(d):
    return {"id": d.id, "user_id": d.user_id, "name": d.user.name, "email": d.user.email,
            "phone": d.user.phone, "department": d.department.name if d.department else "—",
            "department_id": d.department_id, "specialization": d.specialization,
            "qualification": d.qualification, "experience": d.experience,
            "room": d.room_number, "available": d.is_available, "active": d.user.is_active_flag}


def appointment_dict(a):
    token = Token.query.filter_by(appointment_id=a.id).order_by(Token.created_at.desc()).first()
    return {"id": a.id, "patient": a.patient.user.name, "patient_id": a.patient_id,
            "doctor": a.doctor.user.name, "doctor_id": a.doctor_id,
            "department": a.department.name if a.department else "—", "department_id": a.department_id,
            "date": a.appointment_date, "time": a.appointment_time, "reason": a.reason,
            "status": a.status, "token": token.token_number if token else None}


@bp.get("/statistics")
@login_required
def statistics():
    if not require_admin():
        return deny()
    today = date.today().isoformat()
    return jsonify(success=True, statistics={
        "total_patients": Patient.query.count(),
        "total_doctors": Doctor.query.count(),
        "total_departments": Department.query.filter_by(is_active=True).count(),
        "todays_appointments": Appointment.query.filter_by(appointment_date=today).count(),
        "pending_appointments": Appointment.query.filter_by(status="PENDING").count(),
        "completed_appointments": Appointment.query.filter_by(status="COMPLETED").count(),
    })


@bp.get("/patients")
@login_required
def patients():
    if not require_admin(): return deny()
    q = (request.args.get("q") or "").strip().lower()
    rows = Patient.query.join(User, Patient.user_id == User.id).order_by(User.name.asc()).all()
    if q:
        rows = [p for p in rows if q in p.user.name.lower() or q in p.user.email.lower() or q in (p.user.phone or "").lower()]
    return jsonify(success=True, patients=[patient_dict(p) for p in rows])


@bp.get("/doctors")
@login_required
def doctors():
    if not require_admin(): return deny()
    q = (request.args.get("q") or "").strip().lower()
    rows = Doctor.query.join(User, Doctor.user_id == User.id).order_by(User.name.asc()).all()
    if q:
        rows = [d for d in rows if q in d.user.name.lower() or q in d.user.email.lower() or q in (d.department.name if d.department else "").lower()]
    return jsonify(success=True, doctors=[doctor_dict(d) for d in rows])


@bp.get("/appointments")
@login_required
def appointments():
    if not require_admin(): return deny()
    status = request.args.get("status")
    q = Appointment.query.order_by(Appointment.created_at.desc())
    if status: q = q.filter_by(status=status)
    return jsonify(success=True, appointments=[appointment_dict(a) for a in q.all()])


@bp.get("/departments")
@login_required
def departments():
    if not require_admin(): return deny()
    rows = Department.query.order_by(Department.name.asc()).all()
    return jsonify(success=True, departments=[{
        "id": d.id, "name": d.name, "code": d.code, "floor": d.floor,
        "room": d.room, "description": d.description, "is_active": d.is_active
    } for d in rows])


@bp.post("/departments")
@login_required
def add_department():
    if not require_admin(): return deny()
    data = request.get_json() or {}
    if not data.get("name") or not data.get("code"):
        return jsonify(success=False, error="Name and code are required"), 400
    if Department.query.filter((Department.name == data["name"]) | (Department.code == data["code"])).first():
        return jsonify(success=False, error="Department name or code already exists"), 409
    d = Department(name=data["name"], code=data["code"], floor=data.get("floor", 1), room=data.get("room"), description=data.get("description"), is_active=True)
    db.session.add(d); db.session.commit()
    return jsonify(success=True, department={"id": d.id, "name": d.name, "code": d.code, "floor": d.floor, "room": d.room, "description": d.description, "is_active": d.is_active})


@bp.put("/departments/<int:dept_id>")
@login_required
def edit_department(dept_id):
    if not require_admin(): return deny()
    d = Department.query.get_or_404(dept_id)
    data = request.get_json() or {}
    for field in ["name", "code", "floor", "room", "description", "is_active"]:
        if field in data: setattr(d, field, data[field])
    db.session.commit(); return jsonify(success=True)


@bp.delete("/departments/<int:dept_id>")
@login_required
def delete_department(dept_id):
    if not require_admin(): return deny()
    d = Department.query.get_or_404(dept_id); d.is_active = False; db.session.commit()
    return jsonify(success=True)


@bp.put("/users/<int:user_id>/status")
@login_required
def user_status(user_id):
    if not require_admin(): return deny()
    u = User.query.get_or_404(user_id); u.is_active_flag = bool((request.get_json() or {}).get("active", True)); db.session.commit()
    return jsonify(success=True, active=u.is_active_flag)


@bp.get("/analytics")
@login_required
def analytics():
    if not require_admin(): return deny()
    today = date.today()
    start = today - timedelta(days=6)
    rows = Appointment.query.filter(Appointment.appointment_date >= start.isoformat(), Appointment.appointment_date <= today.isoformat()).all()
    daily = []
    for i in range(7):
        d = start + timedelta(days=i)
        key = d.isoformat()
        day_rows = [a for a in rows if a.appointment_date == key]
        daily.append({
            "date": key, "label": d.strftime("%a"),
            "total": len(day_rows),
            "completed": sum(a.status == "COMPLETED" for a in day_rows),
            "pending": sum(a.status == "PENDING" for a in day_rows),
        })

    dept_counts = {}
    for a in rows:
        name = a.department.name if a.department else "Unassigned"
        dept_counts[name] = dept_counts.get(name, 0) + 1
    departments = []
    for d in Department.query.order_by(Department.name.asc()).all():
        departments.append({"id": d.id, "name": d.name, "count": dept_counts.get(d.name, 0)})
    departments.sort(key=lambda x: (-x["count"], x["name"]))

    statuses = {}
    for a in Appointment.query.all():
        statuses[a.status] = statuses.get(a.status, 0) + 1
    return jsonify(success=True, analytics={
        "daily": daily,
        "departments": departments,
        "statuses": statuses,
        "summary": {
            "appointments_7d": len(rows),
            "completed_7d": sum(a.status == "COMPLETED" for a in rows),
            "pending_now": Appointment.query.filter_by(status="PENDING").count(),
            "active_patients": Patient.query.join(User, Patient.user_id == User.id).filter(User.is_active_flag == True).count(),
        },
    })


@bp.get("/users")
@login_required
def users():
    if not require_admin(): return deny()
    q = (request.args.get("q") or "").strip().lower()
    role = (request.args.get("role") or "").strip().upper()
    query = User.query.order_by(User.name.asc())
    if role in {"PATIENT", "DOCTOR", "ADMIN"}: query = query.filter_by(role=role)
    rows = query.all()
    if q:
        rows = [u for u in rows if q in u.name.lower() or q in u.email.lower() or q in (u.phone or "").lower()]
    return jsonify(success=True, users=[user_dict(u) for u in rows])


@bp.get("/navigation/nodes")
@login_required
def navigation_nodes():
    if not require_admin(): return deny()
    from database.models import HospitalNode
    rows = HospitalNode.query.order_by(HospitalNode.name.asc()).all()
    return jsonify(success=True, nodes=[n.name for n in rows])
