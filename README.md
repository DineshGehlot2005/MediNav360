# Smart Hospital Navigation System — improved version

## What is fixed in this version

- Modern responsive authentication screen with Patient / Doctor / Administrator role selection.
- Patient self-registration is available from the sign-in screen.
- Doctor/Admin login is role-aware; public registration is intentionally disabled for those roles.
- Logout is available in the desktop sidebar and the mobile header.
- Login, logout and session checks use the Flask session consistently.
- Better API error handling when the backend is offline or returns a non-JSON response.
- Patient appointment booking now loads doctors from the backend instead of hard-coded doctor IDs.
- Appointment date/time/reason validation is performed on the backend.
- Patients/doctors can only read appointments they are authorized to see.
- Admin "today's appointments" now actually counts today's appointments.
- Cleaner responsive UI, loading states, form feedback and reusable Tailwind utility classes.
- Removed accidental empty brace-named directories from the source tree.

## Project structure

```text
smart-hospital-navigation/
├── backend/
│   ├── app.py                    # Creates Flask app and registers API modules
│   ├── config.py                 # Environment/database/session configuration
│   ├── routes/
│   │   ├── auth.py               # Login, registration, logout, current-user API
│   │   ├── patient.py            # Patient doctors + appointments APIs
│   │   ├── doctor.py             # Doctor requests + token queue APIs
│   │   ├── admin.py              # Admin statistics/management APIs
│   │   ├── ai.py                 # AI department finder APIs
│   │   └── navigation.py         # Dijkstra navigation API
│   ├── database/
│   │   ├── models.py             # SQLAlchemy database tables
│   │   ├── init_db.py            # Creates tables
│   │   └── seed.py               # Development/demo data
│   ├── services/
│   │   ├── token_service.py      # Appointment token generation/queue
│   │   └── navigation_service.py # Converts DB map data into graph
│   ├── algorithms/
│   │   └── dijkstra.py           # Shortest-path algorithm
│   ├── ml/
│   │   ├── train_model.py        # Trains the department classifier
│   │   └── predict.py            # Loads model and predicts department
│   ├── data/
│   │   └── symptoms_departments.csv
│   └── model/                    # Generated .pkl model files (after training)
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js             # Vite dev server + /api proxy
│   └── src/
│       ├── App.jsx                # Main auth/session + role-based page shell
│       ├── api.js                 # All frontend → backend API calls
│       ├── index.css              # Tailwind + reusable UI classes
│       ├── components/
│       │   ├── Landing.jsx        # Modern login/register/role selection screen
│       │   ├── Sidebar.jsx         # Role-specific navigation + logout
│       │   ├── Card.jsx
│       │   └── Badge.jsx
│       └── pages/
│           ├── patient/
│           ├── doctor/
│           └── admin/
│
└── tests/
```

## Important: use Python 3.12 for this project

Your current computer has Python 3.14. The pinned NumPy/scikit-learn versions in this project are intended for Python 3.12, so use Python 3.12 rather than 3.14 for the backend virtual environment.

### First-time backend setup on Windows PowerShell

```powershell
cd D:\Hospital_project\smart-hospital-navigation\smart-hospital-navigationackend
py -3.12 -m venv venv
.env\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
python ml/train_model.py
python database/init_db.py
python database/seed.py
python app.py
```

Backend: `http://127.0.0.1:5000`

### First-time frontend setup

Open a second PowerShell window:

```powershell
cd D:\Hospital_project\smart-hospital-navigation\smart-hospital-navigationrontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.
If port 5173 is busy, Vite may choose 5174; that is okay.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Patient | patient@hospital.demo | patient123 |
| Doctor | doctor.card@hospital.demo | doctor123 |
| Admin | admin@hospital.demo | admin123 |

Every department has a doctor account. See `backend/database/seed.py` for all demo accounts.

## How the application works

1. `frontend/src/App.jsx` checks `/api/auth/me` when the browser opens.
2. If no session exists, `Landing.jsx` shows the role-aware sign-in screen.
3. Login calls `backend/routes/auth.py`.
4. Flask-Login stores the authenticated user in the server session.
5. The role returned by the backend decides which dashboard and navigation items are rendered.
6. Patient appointment actions call `backend/routes/patient.py`.
7. Doctor approval creates a token through `services/token_service.py`.
8. Navigation data is stored as hospital nodes/edges and searched with Dijkstra.
9. The AI finder predicts a department from the trained model, then the navigation service calculates a route.

## Next improvement phase

After the remaining doctor/admin screenshots are shared, the next UI pass should cover:

- Doctor dashboard redesign and real appointment detail views.
- Admin dashboard with charts, department/doctor management and map management.
- Patient profile and notification center.
- Appointment calendar and available time slots.
- Live token queue updates.
- Interactive multi-floor hospital map instead of a text-only route.
- QR-code navigation.
- Hindi/English language switch.
- Better AI explanation and safer medical wording.
- Toast notifications and consistent loading/error/empty states.
- Database migrations with Flask-Migrate instead of rebuilding tables manually.
- Production security: CSRF protection, stronger secrets, rate limiting, audit logging and HTTPS.


MediNav360 - Phase 1 patch

Replace these files in your local D:\MediNav360 project:

1. frontend\src\api.js
2. frontend\src\App.jsx
3. frontend\src\components\Landing.jsx
4. backend\database\models.py
5. backend\database\seed.py

Changes:
- Added patient registration API method.
- Fixed doctor list API path to /api/appointments/doctors.
- Added doctor appointment complete API method.
- Fixed Patient Dashboard -> Hospital Navigation destination passing.
- Corrected Doctor demo email to doctor.cardio@hospital.demo.
- Added Token.appointment relationship so Doctor Queue can resolve patient names.
- Corrected seed.py demo-account output.

After replacing the files:

Backend:
  cd D:\MediNav360\backend
  python app.py

Frontend (new terminal):
  cd D:\MediNav360\frontend
  npm run dev

Then open:
  http://localhost:5173

Test Phase 1:
- Patient Registration
- Patient Book Appointment (doctor list loads)
- Patient Dashboard -> Navigate (department is selected)
- Doctor login with doctor.cardio@hospital.demo / doctor123
- Doctor Approve
- Doctor Queue
- Doctor Complete

No database reset is required for these code changes.
