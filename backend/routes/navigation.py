from flask import Blueprint, request, jsonify
from services.navigation_service import find_route

bp = Blueprint("navigation", __name__, url_prefix="/api/navigation")


@bp.post("/shortest-path")
def shortest_path_route():
    data = request.get_json() or {}
    source = data.get("source")
    destination = data.get("destination")
    mode = data.get("mode", "normal")
    if not source or not destination:
        return jsonify(success=False, error="source and destination are required"), 400

    route = find_route(source, destination, mode)
    if not route:
        return jsonify(success=False, error="No route found between these locations"), 404

    # 1.2 m/s = 72 m/min avg walking speed (hospital mein thoda slow)
    estimated_time_minutes = round(route["distance"] / 72, 2)

    return jsonify(
        success=True,
        path=route["path"],
        distance=route["distance"],
        estimated_time_minutes=estimated_time_minutes,
        mode=mode,
    )