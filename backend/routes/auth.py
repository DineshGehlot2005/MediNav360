from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database.models import db, User, Patient

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def user_to_dict(u: User):
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "phone": u.phone,
        "role": u.role,
    }


def patient_to_dict(p: Patient):
    if not p:
        return {}
    return {
        "id": p.id,
        "date_of_birth": p.date_of_birth,
        "gender": p.gender,
        "address": p.address,
        "blood_group": p.blood_group,
        "emergency_contact": p.emergency_contact,
    }


@bp.post("/register")
def register():
    data = request.get_json() or {}
    required = ["name", "email", "password", "phone"]
    if not all(data.get(f) for f in required):
        return jsonify(success=False, error="Missing required fields"), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify(success=False, error="Email already registered"), 409

    u = User(
        name=data["name"],
        email=data["email"],
        phone=data["phone"],
        role="PATIENT",
    )
    u.set_password(data["password"])
    db.session.add(u)
    db.session.flush()

    db.session.add(Patient(
        user_id=u.id,
        date_of_birth=data.get("date_of_birth"),
        gender=data.get("gender"),
        address=data.get("address"),
        blood_group=data.get("blood_group"),
        emergency_contact=data.get("emergency_contact"),
    ))
    db.session.commit()
    login_user(u)
    return jsonify(success=True, user=user_to_dict(u))


@bp.post("/login")
def login():
    data = request.get_json() or {}
    u = User.query.filter_by(email=data.get("email")).first()
    if not u or not u.check_password(data.get("password", "")) or not u.is_active_flag:
        return jsonify(success=False, error="Invalid credentials"), 401
    login_user(u)
    return jsonify(success=True, user=user_to_dict(u))


@bp.post("/logout")
@login_required
def logout():
    logout_user()
    return jsonify(success=True)


@bp.get("/me")
@login_required
def me():
    return jsonify(success=True, user=user_to_dict(current_user))


# ===== PROFILE: Get full profile =====
@bp.get("/profile")
@login_required
def get_profile():
    user_data = user_to_dict(current_user)
    patient_data = None
    doctor_data = None

    if current_user.role == "PATIENT":
        p = Patient.query.filter_by(user_id=current_user.id).first()
        patient_data = patient_to_dict(p)
    elif current_user.role == "DOCTOR":
        from database.models import Doctor
        d = Doctor.query.filter_by(user_id=current_user.id).first()
        if d:
            doctor_data = {
                "id": d.id,
                "qualification": d.qualification,
                "specialization": d.specialization,
                "experience": d.experience,
                "room_number": d.room_number,
                "photo_url": d.photo_url,
                "fees": d.fees,
                "rating": d.rating,
                "review_count": d.review_count,
                "consultation_duration": d.consultation_duration,
                "bio": d.bio,
                "languages": d.languages,
                "department": d.department.name if d.department else None,
                "is_available": d.is_available,
            }

    return jsonify(
        success=True,
        user=user_data,
        patient=patient_data,
        doctor=doctor_data,
    )


# ===== PROFILE: Update profile =====
@bp.put("/profile")
@login_required
def update_profile():
    data = request.get_json() or {}

    # ===== USER FIELDS =====
    if "name" in data and data["name"].strip():
        current_user.name = data["name"].strip()
    if "phone" in data:
        current_user.phone = (data["phone"] or "").strip()

    # ===== PATIENT FIELDS =====
    if current_user.role == "PATIENT":
        p = Patient.query.filter_by(user_id=current_user.id).first()
        if not p:
            p = Patient(user_id=current_user.id)
            db.session.add(p)

        if "date_of_birth" in data:
            p.date_of_birth = data["date_of_birth"] or None
        if "gender" in data:
            p.gender = data["gender"] or None
        if "address" in data:
            p.address = data["address"] or None
        if "blood_group" in data:
            p.blood_group = data["blood_group"] or None
        if "emergency_contact" in data:
            p.emergency_contact = data["emergency_contact"] or None

    # ===== DOCTOR FIELDS =====
    if current_user.role == "DOCTOR":
        from database.models import Doctor
        d = Doctor.query.filter_by(user_id=current_user.id).first()
        if d:
            if "qualification" in data:
                d.qualification = (data["qualification"] or "").strip() or None
            if "specialization" in data:
                d.specialization = (data["specialization"] or "").strip() or None
            if "experience" in data:
                try:
                    d.experience = int(data["experience"]) if data["experience"] not in (None, "") else None
                except (ValueError, TypeError):
                    pass
            if "room_number" in data:
                d.room_number = (data["room_number"] or "").strip() or None
            if "fees" in data:
                try:
                    d.fees = int(data["fees"]) if data["fees"] not in (None, "") else 500
                except (ValueError, TypeError):
                    pass
            if "consultation_duration" in data:
                try:
                    d.consultation_duration = int(data["consultation_duration"]) if data["consultation_duration"] not in (None, "") else 15
                except (ValueError, TypeError):
                    pass
            if "bio" in data:
                d.bio = (data["bio"] or "").strip() or None
            if "languages" in data:
                d.languages = (data["languages"] or "").strip() or None
            if "is_available" in data:
                d.is_available = bool(data["is_available"])

    db.session.commit()
    return jsonify(success=True, user=user_to_dict(current_user))