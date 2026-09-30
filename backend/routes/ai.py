from flask import Blueprint, request, jsonify
from ml.predict import predict_department, check_emergency

bp = Blueprint("ai", __name__, url_prefix="/api")


@bp.post("/predict")
def predict():
    data = request.get_json() or {}
    symptoms = data.get("symptoms", "")
    if not symptoms.strip():
        return jsonify(success=False, error="Symptoms text is required"), 400

    if check_emergency(symptoms):
        return jsonify(
            success=True, emergency=True,
            warning="These symptoms may require urgent medical attention. "
                    "Please contact emergency services or hospital emergency staff immediately.",
        )
    try:
        result = predict_department(symptoms)
    except FileNotFoundError as e:
        return jsonify(success=False, error=str(e)), 503

    return jsonify(
        success=True, emergency=False,
        department=result["department"], confidence=result["confidence"],
        disclaimer="AI-generated department suggestions are for navigation assistance "
                   "only and are not a medical diagnosis.",
    )


@bp.post("/ai-navigation")
def ai_navigation():
    from services.navigation_service import find_route
    from database.models import Department

    data = request.get_json() or {}
    symptoms = data.get("symptoms", "")
    source = data.get("source", "Entrance")

    if check_emergency(symptoms):
        return jsonify(success=True, emergency=True,
                        warning="These symptoms may require urgent medical attention. "
                                "Please contact emergency services immediately.")

    result = predict_department(symptoms)
    dept = Department.query.filter_by(name=result["department"]).first()
    dest_node = dept.name if dept else result["department"]

    route = find_route(source, dest_node)
    if not route:
        return jsonify(success=False, error="No route found"), 404

    return jsonify(
        success=True, department=result["department"], confidence=result["confidence"],
        path=route["path"], distance=route["distance"],
        estimated_time_minutes=max(1, round(route["distance"] / 25)),
        disclaimer="AI-generated department suggestions are for navigation assistance "
                   "only and are not a medical diagnosis.",
    )
