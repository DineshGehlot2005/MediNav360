from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # PATIENT, DOCTOR, ADMIN
    is_active_flag = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, pw):
        self.password_hash = generate_password_hash(pw)

    def check_password(self, pw):
        return check_password_hash(self.password_hash, pw)

    @property
    def is_active(self):
        return self.is_active_flag


class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    date_of_birth = db.Column(db.String(20))
    gender = db.Column(db.String(20))
    address = db.Column(db.String(255))
    blood_group = db.Column(db.String(5))
    emergency_contact = db.Column(db.String(20))
    user = db.relationship("User")


class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    code = db.Column(db.String(10), unique=True, nullable=False)
    floor = db.Column(db.Integer, default=1)
    room = db.Column(db.String(20))
    description = db.Column(db.String(255))
    map_node_id = db.Column(db.Integer, db.ForeignKey("hospital_node.id"))
    is_active = db.Column(db.Boolean, default=True)


class Doctor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey("department.id"), nullable=False)
    qualification = db.Column(db.String(120))
    specialization = db.Column(db.String(120))
    experience = db.Column(db.Integer)
    room_number = db.Column(db.String(20))
    is_available = db.Column(db.Boolean, default=True)
    user = db.relationship("User")
    department = db.relationship("Department")


class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey("department.id"), nullable=False)
    appointment_date = db.Column(db.String(20))
    appointment_time = db.Column(db.String(20))
    reason = db.Column(db.String(255))
    notes = db.Column(db.String(255))
    status = db.Column(db.String(20), default="PENDING")  # PENDING/APPROVED/REJECTED/COMPLETED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    patient = db.relationship("Patient")
    doctor = db.relationship("Doctor")
    department = db.relationship("Department")


class Token(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointment.id"), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey("department.id"), nullable=False)
    token_number = db.Column(db.String(10), nullable=False)
    token_date = db.Column(db.String(20))
    status = db.Column(db.String(20), default="WAITING")  # WAITING/CALLED/IN_PROGRESS/COMPLETED/CANCELLED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    called_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    appointment = db.relationship("Appointment")


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    message = db.Column(db.String(255))
    type = db.Column(db.String(30))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class HospitalNode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    node_type = db.Column(db.String(30))
    floor = db.Column(db.Integer, default=1)
    room = db.Column(db.String(20))
    x = db.Column(db.Float, default=0)
    y = db.Column(db.Float, default=0)
    is_accessible = db.Column(db.Boolean, default=True)


class HospitalEdge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    source_node_id = db.Column(db.Integer, db.ForeignKey("hospital_node.id"), nullable=False)
    destination_node_id = db.Column(db.Integer, db.ForeignKey("hospital_node.id"), nullable=False)
    distance = db.Column(db.Integer, nullable=False)
    has_stairs = db.Column(db.Boolean, default=False)
    wheelchair_accessible = db.Column(db.Boolean, default=True)
    is_elevator = db.Column(db.Boolean, default=False)


class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient.id"))
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointment.id"))
    navigation_rating = db.Column(db.Integer)
    appointment_rating = db.Column(db.Integer)
    waiting_rating = db.Column(db.Integer)
    overall_rating = db.Column(db.Integer)
    comment = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
