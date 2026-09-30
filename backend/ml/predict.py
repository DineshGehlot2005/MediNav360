"""
Load the trained model and predict a department from symptom text.
This is for NAVIGATION ASSISTANCE ONLY -- not a medical diagnosis.
"""
import os
import joblib

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE, "model", "department_model.pkl")
VEC_PATH = os.path.join(BASE, "model", "vectorizer.pkl")

_model = None
_vectorizer = None


def _load():
    global _model, _vectorizer
    if _model is None or _vectorizer is None:
        if not (os.path.exists(MODEL_PATH) and os.path.exists(VEC_PATH)):
            raise FileNotFoundError(
                "Model not found. Run `python ml/train_model.py` first."
            )
        _model = joblib.load(MODEL_PATH)
        _vectorizer = joblib.load(VEC_PATH)
    return _model, _vectorizer


def predict_department(symptoms: str):
    if not symptoms or not symptoms.strip():
        raise ValueError("Symptoms text is empty.")
    model, vectorizer = _load()
    text = symptoms.lower().strip()
    vec = vectorizer.transform([text])
    department = model.predict(vec)[0]
    confidence = None
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(vec)[0]
        confidence = float(max(proba))
    return {"department": department, "confidence": confidence}


EMERGENCY_KEYWORDS = [
    "severe chest pain", "can't breathe", "cannot breathe", "unconscious",
    "not breathing", "severe bleeding", "heart attack", "stroke",
]


def check_emergency(symptoms: str) -> bool:
    text = (symptoms or "").lower()
    return any(k in text for k in EMERGENCY_KEYWORDS)
