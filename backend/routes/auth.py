from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from database.models import db, User, Patient

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def user_to_dict(u: User):
    return {"id": u.id, "name": u.name, "email": u.email, "role": u.role}


@bp.post("/register")
def register():
    data = request.get_json() or {}
    required = ["name", "email", "password", "phone"]
    if not all(data.get(f) for f in required):
        return jsonify(success=False, error="Missing required fields"), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify(success=False, error="Email already registered"), 409

    u = User(name=data["name"], email=data["email"], phone=data["phone"], role="PATIENT")
    u.set_password(data["password"])
    db.session.add(u)
    db.session.flush()
    db.session.add(Patient(
        user_id=u.id, date_of_birth=data.get("date_of_birth"), gender=data.get("gender"),
        address=data.get("address"), blood_group=data.get("blood_group"),
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
