import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")

    # Fix Render's postgres:// URL for SQLAlchemy
    # Force psycopg2 driver (we install psycopg2-binary, not psycopg3)
    _db_url = os.environ.get("DATABASE_URL", "sqlite:///hospital.db")

    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace(
            "postgres://", "postgresql+psycopg2://", 1
        )
    elif _db_url.startswith("postgresql://"):
        _db_url = _db_url.replace(
            "postgresql://", "postgresql+psycopg2://", 1
        )

    SQLALCHEMY_DATABASE_URI = _db_url

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    FRONTEND_ORIGIN = os.environ.get(
        "FRONTEND_ORIGIN", "http://localhost:5173"
    )

    # Session cookie settings
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_COOKIE_SECURE = (
        os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true"
    )