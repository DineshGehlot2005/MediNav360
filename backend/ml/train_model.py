"""
Train the department-prediction model.
Run: python ml/train_model.py
Pipeline: CSV -> clean text -> TF-IDF -> Logistic Regression -> save model+vectorizer
Educational/demo dataset only -- NOT clinically validated.
"""
import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE, "data", "symptoms_departments.csv")
MODEL_DIR = os.path.join(BASE, "model")


def clean_text(text: str) -> str:
    return text.lower().strip()


def main():
    df = pd.read_csv(CSV_PATH)
    if df.empty or "symptoms" not in df.columns or "department" not in df.columns:
        raise ValueError("Dataset must have 'symptoms' and 'department' columns.")

    df["symptoms"] = df["symptoms"].astype(str).apply(clean_text)

    X_train, X_test, y_train, y_test = train_test_split(
        df["symptoms"], df["department"], test_size=0.25, random_state=42, stratify=df["department"]
    )

    vectorizer = TfidfVectorizer()
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train_vec, y_train)

    preds = model.predict(X_test_vec)
    acc = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds, average="weighted", zero_division=0)
    rec = recall_score(y_test, preds, average="weighted", zero_division=0)
    f1 = f1_score(y_test, preds, average="weighted", zero_division=0)

    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"Accuracy:  {acc:.2%}")
    print(f"Precision: {prec:.2%}")
    print(f"Recall:    {rec:.2%}")
    print(f"F1 score:  {f1:.2%}")

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, os.path.join(MODEL_DIR, "department_model.pkl"))
    joblib.dump(vectorizer, os.path.join(MODEL_DIR, "vectorizer.pkl"))
    print(f"Saved model to {MODEL_DIR}")


if __name__ == "__main__":
    main()
