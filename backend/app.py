import os
import sqlite3
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO

from config import Config
from models import db

# Configure logging (auto-reload trigger)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("LatticeLink")
# DB reset flag trigger check

app = Flask(__name__)
app.config['SECRET_KEY'] = Config.SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH

# Enable CORS for API routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

db.init_app(app)

# Initialize SocketIO with cross-origin support
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    ping_timeout=60,
    ping_interval=25,
    logger=True,
    engineio_logger=True
)

@app.before_request
def log_incoming_request():
    logger.info(f"==> [{request.method}] {request.path} from {request.remote_addr}")


def auto_migrate_schema():
    """Safely inspect and migrate SQLite columns without destroying existing data."""
    if not Config.SQLALCHEMY_DATABASE_URI.startswith('sqlite:///'):
        return

    db_path = Config.SQLALCHEMY_DATABASE_URI.replace('sqlite:///', '')
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        migrations = [
            # table, column, column_type
            ("users", "role", "VARCHAR(20) DEFAULT 'USER'"),
            ("users", "is_verified", "BOOLEAN DEFAULT 0"),
            ("users", "verification_token_hash", "VARCHAR(255)"),
            ("users", "verification_token_expires", "DATETIME"),
            ("users", "settings_json", "TEXT"),
            ("files", "receiver", "VARCHAR(80)"),
            ("keys", "key_version", "INTEGER DEFAULT 1"),
            ("keys", "key_type", "VARCHAR(50) DEFAULT 'ML-KEM-768/ML-DSA-65'"),
            ("keys", "fingerprint", "VARCHAR(128)"),
            ("keys", "revoked_at", "DATETIME"),
            ("messages", "nonce", "VARCHAR(64)"),
            ("messages", "key_version", "INTEGER DEFAULT 1"),
            ("messages", "file_id", "VARCHAR(80)"),
        ]
        
        for table, column, col_type in migrations:
            try:
                cursor.execute(f"PRAGMA table_info({table});")
                existing_cols = [row[1] for row in cursor.fetchall()]
                if existing_cols and column not in existing_cols:
                    cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type};")
                    conn.commit()
                    logger.info(f"[AutoMigrate] Added missing column {column} to {table}")
            except Exception as e:
                logger.warning(f"[AutoMigrate Warning] Could not alter {table}.{column}: {e}")
        conn.close()

# Initialize directories, tables, and auto-migrate safely (NEVER drops user data)
with app.app_context():
    os.makedirs(app.instance_path, exist_ok=True)
    os.makedirs(os.path.join(Config.BASE_DIR, 'instance'), exist_ok=True)
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    try:
        db.create_all()
        auto_migrate_schema()
        logger.info("Database and uploads directory initialized successfully (safe startup, no tables dropped).")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

@app.teardown_request
def teardown_request(exception=None):
    if exception:
        db.session.rollback()
    db.session.remove()

# Import and register blueprints
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.chat_routes import chat_bp
from routes.vault_routes import vault_bp
from routes.security_routes import security_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/user')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(vault_bp, url_prefix='/api/vault')
app.register_blueprint(security_bp, url_prefix='/api/security')

@app.route('/')
def index():
    return jsonify({
        "name": "LatticeLink Canonical API Server",
        "version": Config.VERSION,
        "status": "online",
        "pqc": "ML-KEM-768 / ML-DSA-65"
    })

@app.route('/api/health')
def health():
    """Robust health endpoint returning full operational status."""
    try:
        from models import User
        user_count = User.query.count()
        return jsonify({
            'status': 'ok',
            'database': 'connected',
            'socketio': 'ready',
            'version': Config.VERSION,
            'users_registered': user_count
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Health check database failure: {e}")
        return jsonify({
            'status': 'degraded',
            'database': 'error',
            'socketio': 'ready',
            'error': str(e),
            'version': Config.VERSION
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    logger.error(f"Internal Server Error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

# Socket.IO Event Handlers
from routes.chat_routes import init_socketio as init_chat_socketio
init_chat_socketio(socketio)

if __name__ == '__main__':
    logger.info(f"Starting LatticeLink server on {Config.HOST}:{Config.PORT}")
    socketio.run(app, host=Config.HOST, port=Config.PORT, debug=Config.DEBUG, use_reloader=False)

