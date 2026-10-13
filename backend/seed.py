import os
import sys

from app import create_app
from database.models import (
    db, User, Patient, Doctor, Department,
    HospitalNode, HospitalEdge,
)

app = create_app()


def seed_database(force=False):
    """Seed database. If data exists and force=False, skip seeding."""

    environment = os.environ.get("ENVIRONMENT", "development").lower()
    is_prod = environment == "production"

    print(f"[*] Environment: {environment}")

    # Check existing data
    existing_users = User.query.count()
    if existing_users > 0 and not force:
        print(f"[SKIP] Database already has {existing_users} user(s).")
        print("[SKIP] Skipping seed to preserve existing data.")
        print("[INFO] To reset and re-seed, run: python seed.py --force")
        return False

    if force:
        print("[*] Force mode: Dropping all tables...")
        db.drop_all()
    else:
        print("[*] Fresh database: Creating all tables...")

    db.create_all()

    # ===== HOSPITAL NODES =====
    nodes_data = [
        {"name": "Entrance", "node_type": "entrance", "floor": 1, "room": None, "x": 80, "y": 320, "is_accessible": True},
        {"name": "Reception", "node_type": "reception", "floor": 1, "room": "G-01", "x": 200, "y": 280, "is_accessible": True},
        {"name": "Main Corridor", "node_type": "corridor", "floor": 1, "room": None, "x": 320, "y": 240, "is_accessible": True},
        {"name": "Elevator", "node_type": "elevator", "floor": 1, "room": None, "x": 420, "y": 200, "is_accessible": True},
        {"name": "Pharmacy", "node_type": "pharmacy", "floor": 1, "room": "G-05", "x": 500, "y": 320, "is_accessible": True},
        {"name": "General Medicine", "node_type": "department", "floor": 2, "room": "101", "x": 180, "y": 200, "is_accessible": True},
        {"name": "Dermatology", "node_type": "department", "floor": 2, "room": "108", "x": 80, "y": 120, "is_accessible": True},
        {"name": "ENT", "node_type": "department", "floor": 2, "room": "112", "x": 300, "y": 100, "is_accessible": True},
        {"name": "Cardiology", "node_type": "department", "floor": 3, "room": "204", "x": 500, "y": 120, "is_accessible": True},
        {"name": "Orthopedics", "node_type": "department", "floor": 3, "room": "210", "x": 620, "y": 200, "is_accessible": True},
        {"name": "Neurology", "node_type": "department", "floor": 3, "room": "215", "x": 620, "y": 100, "is_accessible": True},
    ]

    node_map = {}
    for n in nodes_data:
        node = HospitalNode(**n)
        db.session.add(node)
        db.session.flush()
        node_map[n["name"]] = node
    print(f"[OK] Added {len(node_map)} hospital nodes")

    # ===== HOSPITAL EDGES =====
    edges_data = [
        ("Entrance", "Reception", 15, False, True, False),
        ("Reception", "Main Corridor", 20, False, True, False),
        ("Main Corridor", "Elevator", 10, False, True, False),
        ("Main Corridor", "General Medicine", 25, False, True, False),
        ("General Medicine", "Dermatology", 30, False, True, False),
        ("General Medicine", "ENT", 35, False, True, False),
        ("Elevator", "Cardiology", 40, False, True, True),
        ("Elevator", "Orthopedics", 45, False, True, True),
        ("Elevator", "Neurology", 50, False, True, True),
        ("Reception", "Pharmacy", 25, False, True, False),
    ]
    for src, dest, dist, stairs, accessible, elevator in edges_data:
        db.session.add(HospitalEdge(
            source_node_id=node_map[src].id,
            destination_node_id=node_map[dest].id,
            distance=dist, has_stairs=stairs,
            wheelchair_accessible=accessible, is_elevator=elevator,
        ))
    print(f"[OK] Added {len(edges_data)} edges")

    # ===== DEPARTMENTS =====
    departments_data = [
        {"name": "Cardiology", "code": "CARD", "floor": 2, "room": "204", "description": "Heart and cardiovascular care", "node": "Cardiology"},
        {"name": "Dermatology", "code": "DERM", "floor": 1, "room": "108", "description": "Skin, hair, and nail care", "node": "Dermatology"},
        {"name": "ENT", "code": "ENT", "floor": 1, "room": "112", "description": "Ear, nose, and throat care", "node": "ENT"},
        {"name": "General Medicine", "code": "GEN", "floor": 1, "room": "101", "description": "General health and primary care", "node": "General Medicine"},
        {"name": "Neurology", "code": "NEUR", "floor": 2, "room": "215", "description": "Brain and nervous system", "node": "Neurology"},
        {"name": "Orthopedics", "code": "ORTH", "floor": 2, "room": "210", "description": "Bones and joints", "node": "Orthopedics"},
    ]
    depts = {}
    for d in departments_data:
        dept = Department(
            name=d["name"], code=d["code"], floor=d["floor"],
            room=d["room"], description=d["description"],
            map_node_id=node_map[d["node"]].id,
        )
        db.session.add(dept)
        db.session.flush()
        depts[d["code"]] = dept
    print(f"[OK] Added {len(depts)} departments")

    # ===== ADMIN USER =====
    if is_prod:
        # Production: strong password from env, ya fallback
        admin_password = os.environ.get("ADMIN_PASSWORD", "ChangeMe_Admin@2026")
        admin_email = os.environ.get("ADMIN_EMAIL", "admin@smart-hospital.com")
        print(f"[PROD] Creating admin: {admin_email}")
    else:
        admin_password = "admin123"
        admin_email = "admin@hospital.demo"
        print(f"[DEV] Creating demo admin: {admin_email}")

    admin = User(
        name="Hospital Admin",
        email=admin_email,
        phone="9990000001",
        role="ADMIN",
    )
    admin.set_password(admin_password)
    db.session.add(admin)

    # ===== DEMO PATIENT + DOCTORS (only in development) =====
    if not is_prod:
        patient_user = User(
            name="Demo Patient",
            email="patient@hospital.demo",
            phone="9990000003",
            role="PATIENT",
        )
        patient_user.set_password("patient123")
        db.session.add(patient_user)
        db.session.flush()
        db.session.add(Patient(user_id=patient_user.id, gender="Other", blood_group="O+"))
        print("[DEV] Added demo patient")

        DOCTOR_DATA = {
            "CARD": {
                "name": "Dr. Rahul Sharma",
                "photo": "/doctors/rahul-sharma.jpg",
                "qualification": "MBBS, MD (Cardiology), DM",
                "experience": 14, "fees": 800, "rating": 4.8, "review_count": 245,
                "duration": 20,
                "bio": "Interventional cardiologist with 14+ years of experience in angioplasty and heart failure management.",
                "languages": "Hindi, English, Marwari",
            },
            "ORTH": {
                "name": "Dr. Meera Nair",
                "photo": "/doctors/meera-nair.jpg",
                "qualification": "MBBS, MS (Orthopedics)",
                "experience": 11, "fees": 700, "rating": 4.7, "review_count": 189,
                "duration": 15,
                "bio": "Joint replacement and sports injury specialist. Trained at AIIMS Delhi.",
                "languages": "Hindi, English, Malayalam",
            },
            "NEUR": {
                "name": "Dr. Aman Gupta",
                "photo": "/doctors/aman-gupta.jpg",
                "qualification": "MBBS, MD, DM (Neurology)",
                "experience": 16, "fees": 1000, "rating": 4.9, "review_count": 312,
                "duration": 20,
                "bio": "Senior neurologist specializing in stroke, epilepsy, and movement disorders.",
                "languages": "Hindi, English",
            },
            "DERM": {
                "name": "Dr. Priya Rao",
                "photo": "/doctors/priya-rao.jpg",
                "qualification": "MBBS, MD (Dermatology)",
                "experience": 9, "fees": 600, "rating": 4.6, "review_count": 156,
                "duration": 15,
                "bio": "Cosmetic and clinical dermatologist. Expert in acne, pigmentation, and hair treatments.",
                "languages": "Hindi, English, Kannada",
            },
            "ENT": {
                "name": "Dr. Sanjay Iyer",
                "photo": "/doctors/sanjay-iyer.jpg",
                "qualification": "MBBS, MS (ENT)",
                "experience": 12, "fees": 550, "rating": 4.5, "review_count": 134,
                "duration": 15,
                "bio": "ENT specialist with expertise in endoscopic sinus surgery and hearing disorders.",
                "languages": "Hindi, English, Tamil",
            },
            "GEN": {
                "name": "Dr. Kavita Joshi",
                "photo": "/doctors/kavita-joshi.jpg",
                "qualification": "MBBS, MD (General Medicine)",
                "experience": 10, "fees": 400, "rating": 4.7, "review_count": 278,
                "duration": 10,
                "bio": "General physician with focus on preventive care, diabetes, and hypertension management.",
                "languages": "Hindi, English, Marathi",
            },
        }

        for code, dept in depts.items():
            data = DOCTOR_DATA[code]
            u = User(
                name=data["name"],
                email=f"doctor.{code.lower()}@hospital.demo",
                phone="9990000002",
                role="DOCTOR",
            )
            u.set_password("doctor123")
            db.session.add(u)
            db.session.flush()

            db.session.add(Doctor(
                user_id=u.id, department_id=dept.id,
                qualification=data["qualification"], specialization=dept.name,
                experience=data["experience"], room_number=dept.room,
                photo_url=data["photo"], fees=data["fees"], rating=data["rating"],
                review_count=data["review_count"], consultation_duration=data["duration"],
                bio=data["bio"], languages=data["languages"],
            ))
        print(f"[DEV] Added {len(DOCTOR_DATA)} demo doctors")
    else:
        print("[PROD] Skipped demo patient and doctors (production mode)")
        print("[PROD] Admin can create doctors via Add Doctor feature")

    db.session.commit()
    print("[DONE] Database seeded successfully!")

    if is_prod:
        print("\n" + "=" * 60)
        print("[!] PRODUCTION MODE — Admin credentials:")
        print(f"    Email:    {admin_email}")
        print(f"    Password: {admin_password}")
        print("[!] Change this password after first login!")
        print("=" * 60 + "\n")

    return True


if __name__ == "__main__":
    force = "--force" in sys.argv
    with app.app_context():
        seed_database(force=force)