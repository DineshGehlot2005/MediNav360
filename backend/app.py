from flask import Flask, jsonify
from flask_login import LoginManager
from flask_cors import CORS
import os

from config import Config
from database.models import db, User


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify(success=False, error="Login required"), 401

        # CORS — support multiple origins (localhost + production)
    origins = [
        o.strip()
        for o in app.config["FRONTEND_ORIGIN"].split(",")
        if o.strip()
    ]
    CORS(
        app,
        supports_credentials=True,
        origins=origins,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    from routes.auth import bp as auth_bp
    from routes.patient import bp as patient_bp
    from routes.doctor import bp as doctor_bp
    from routes.admin import bp as admin_bp
    from routes.ai import bp as ai_bp
    from routes.navigation import bp as navigation_bp
    from routes.notifications import bp as notifications_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(navigation_bp)
    app.register_blueprint(notifications_bp)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify(success=False, error="Not found"), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify(success=False, error="Internal server error"), 500

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)