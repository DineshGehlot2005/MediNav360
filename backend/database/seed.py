"""Run: python database/seed.py  -- inserts demo data.
Demo accounts (development only, change in production):
  admin@hospital.demo   / admin123   (ADMIN)
  doctor.cardio@hospital.demo / doctor123 (DOCTOR)
  patient@hospital.demo / patient123 (PATIENT)
"""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from database.models import (
    db, User, Patient, Doctor, Department, HospitalNode, HospitalEdge
)

app = create_app()

DEPARTMENTS = [
    ("Cardiology", "CARD", 2, "204"),
    ("Orthopedics", "ORTH", 2, "210"),
    ("Neurology", "NEUR", 2, "215"),
    ("Dermatology", "DERM", 1, "108"),
    ("ENT", "ENT", 1, "112"),
    ("General Medicine", "GEN", 1, "101"),
]

NODES = [
    ("Entrance", "entrance", 1, 0, 0),
    ("Reception", "reception", 1, 100, 0),
    ("Main Corridor", "corridor", 1, 200, 0),
    ("Elevator", "elevator", 1, 300, 0),
    ("Pharmacy", "service", 1, 200, 100),
    ("General Medicine", "department", 1, 200, -100),
    ("Dermatology", "department", 1, 300, 100),
    ("ENT", "department", 1, 300, -100),
    ("Cardiology", "department", 2, 400, 0),
    ("Orthopedics", "department", 2, 450, 50),
    ("Neurology", "department", 2, 450, -50),
]

EDGES = [
    ("Entrance", "Reception", 5, False, True, False),
    ("Reception", "Main Corridor", 10, False, True, False),
    ("Main Corridor", "Elevator", 5, False, True, True),
    ("Main Corridor", "Pharmacy", 6, False, True, False),
    ("Main Corridor", "General Medicine", 4, False, True, False),
    ("Main Corridor", "Dermatology", 9, False, True, False),
    ("Main Corridor", "ENT", 11, False, True, False),
    ("Elevator", "Cardiology", 8, False, True, True),
    ("Elevator", "Orthopedics", 10, False, True, True),
    ("Elevator", "Neurology", 12, False, True, True),
]

with app.app_context():
    db.drop_all()
    db.create_all()

    nodes = {}
    for name, ntype, floor, x, y in NODES:
        n = HospitalNode(name=name, node_type=ntype, floor=floor, x=x, y=y, is_accessible=True)
        db.session.add(n)
        nodes[name] = n
    db.session.flush()

    for src, dst, dist, stairs, wheel, elevator in EDGES:
        db.session.add(HospitalEdge(
            source_node_id=nodes[src].id, destination_node_id=nodes[dst].id,
            distance=dist, has_stairs=stairs, wheelchair_accessible=wheel, is_elevator=elevator
        ))
        db.session.add(HospitalEdge(
            source_node_id=nodes[dst].id, destination_node_id=nodes[src].id,
            distance=dist, has_stairs=stairs, wheelchair_accessible=wheel, is_elevator=elevator
        ))

    depts = {}
    for name, code, floor, room in DEPARTMENTS:
        d = Department(name=name, code=code, floor=floor, room=room,
                        map_node_id=nodes[name].id, is_active=True)
        db.session.add(d)
        depts[code] = d
    db.session.flush()

    admin = User(name="Hospital Admin", email="admin@hospital.demo", phone="9990000001", role="ADMIN")
    admin.set_password("admin123")
    db.session.add(admin)

    doctor_names = {
        "CARD": "Dr. Rahul Sharma", "ORTH": "Dr. Meera Nair", "NEUR": "Dr. Aman Gupta",
        "DERM": "Dr. Priya Rao", "ENT": "Dr. Sanjay Iyer", "GEN": "Dr. Kavita Joshi",
    }
    for code, dept in depts.items():
        u = User(name=doctor_names[code], email=f"doctor.{code.lower()}@hospital.demo",
                 phone="9990000002", role="DOCTOR")
        u.set_password("doctor123")
        db.session.add(u)
        db.session.flush()
        db.session.add(Doctor(user_id=u.id, department_id=dept.id, qualification="MBBS, MD",
                               specialization=dept.name, experience=8, room_number=dept.room))

    patient_user = User(name="Demo Patient", email="patient@hospital.demo", phone="9990000003", role="PATIENT")
    patient_user.set_password("patient123")
    db.session.add(patient_user)
    db.session.flush()
    db.session.add(Patient(user_id=patient_user.id, date_of_birth="2000-01-01", gender="Other",
                            address="Jaipur", blood_group="O+", emergency_contact="9990000004"))

    db.session.commit()
    print("Seed complete. Demo accounts: admin@hospital.demo/admin123, "
          "doctor.card@hospital.demo/doctor123, patient@hospital.demo/patient123")
