from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from database.models import db, Notification

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


def notification_to_dict(n):
    return {
        "id": n.id,
        "message": n.message,
        "type": n.type or "general",
        "is_read": bool(n.is_read),
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }


@bp.get("")
@login_required
def list_notifications():
    """List all notifications for current user, newest first."""
    limit = request.args.get("limit", type=int) or 50
    notifications = (
        Notification.query
        .filter_by(user_id=current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    unread = Notification.query.filter_by(
        user_id=current_user.id, is_read=False
    ).count()
    return jsonify(
        success=True,
        notifications=[notification_to_dict(n) for n in notifications],
        unread_count=unread,
    )


@bp.get("/unread-count")
@login_required
def unread_count():
    count = Notification.query.filter_by(
        user_id=current_user.id, is_read=False
    ).count()
    return jsonify(success=True, unread_count=count)


@bp.post("/<int:notif_id>/read")
@login_required
def mark_read(notif_id):
    n = Notification.query.filter_by(
        id=notif_id, user_id=current_user.id
    ).first()
    if not n:
        return jsonify(success=False, error="Notification not found"), 404
    n.is_read = True
    db.session.commit()
    return jsonify(success=True)


@bp.post("/read-all")
@login_required
def mark_all_read():
    Notification.query.filter_by(
        user_id=current_user.id, is_read=False
    ).update({"is_read": True})
    db.session.commit()
    return jsonify(success=True)


# ===== Helper (imported by other blueprints) =====
def create_notification(user_id, message, type_="general"):
    """Helper to create a notification. Call from anywhere."""
    try:
        n = Notification(
            user_id=user_id,
            message=message[:255],
            type=type_,
        )
        db.session.add(n)
        return n
    except Exception:
        return None