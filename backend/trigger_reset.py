import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from config import Config

if '--test-only' not in sys.argv or '--confirm-test-wipe' not in sys.argv:
    print("CRITICAL SAFETY GUARD: Destructive reset script disabled on active database.", file=sys.stderr)
    print("To reset the isolated test database, you must explicitly run:", file=sys.stderr)
    print("  python trigger_reset.py --test-only --confirm-test-wipe", file=sys.stderr)
    sys.exit(1)

# Enforce test mode and verify safety guard
os.environ['LATTICELINK_TEST_MODE'] = 'True'
test_db_uri = f"sqlite:///{Config.TEST_DB_PATH.replace(os.sep, '/')}"

try:
    Config.assert_safe_for_destructive_action("trigger_reset.py", uri=test_db_uri)
except RuntimeError as e:
    print(f"SAFETY ABORT: {e}", file=sys.stderr)
    sys.exit(1)

from app import app
from models import db

app.config['SQLALCHEMY_DATABASE_URI'] = test_db_uri
with app.app_context():
    print(f"Resetting isolated test database: {Config.TEST_DB_PATH}")
    db.drop_all()
    db.create_all()
    print("Isolated test database reset successfully. Real database was NOT touched.")
