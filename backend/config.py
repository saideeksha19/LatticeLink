import os
import secrets

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_env(env_path=os.path.join(BASE_DIR, '.env')):
    """Lightweight .env loader without third-party dependencies."""
    paths_to_check = [
        env_path,
        os.path.join(os.path.dirname(BASE_DIR), '.env')
    ]
    for path in paths_to_check:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    if '=' in line:
                        key, val = line.split('=', 1)
                        key = key.strip()
                        val = val.strip().strip('"').strip("'")
                        if key and key not in os.environ:
                            os.environ[key] = val

# Load local environment configuration
load_env()

class Config:
    BASE_DIR = BASE_DIR
    VERSION = "1.0.0-pqc-hardened"
    SECRET_KEY = os.getenv('SECRET_KEY', 'latticelink-quantum-resistant-production-secret-key-128')
    
    LATTICELINK_TEST_MODE = os.getenv('LATTICELINK_TEST_MODE', 'False').lower() == 'true'
    
    # SQLite paths for development vs testing
    DEFAULT_DB_PATH = os.path.join(BASE_DIR, 'instance', 'latticelink.db')
    TEST_DB_PATH = os.path.join(BASE_DIR, 'instance', 'latticelink_test.db')
    
    _raw_db_url = os.getenv('DATABASE_URL', '')
    if LATTICELINK_TEST_MODE and not _raw_db_url:
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{TEST_DB_PATH.replace(os.sep, '/')}"
    elif not _raw_db_url or _raw_db_url.strip() in ('', 'sqlite:///instance/latticelink.db'):
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{DEFAULT_DB_PATH.replace(os.sep, '/')}"
    elif _raw_db_url.startswith('sqlite:///') and not os.path.isabs(_raw_db_url.replace('sqlite:///', '')):
        _rel_path = _raw_db_url.replace('sqlite:///', '')
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, _rel_path).replace(os.sep, '/')}"
    else:
        SQLALCHEMY_DATABASE_URI = _raw_db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"connect_args": {"timeout": 30}}
    
    @classmethod
    def is_test_database(cls, uri=None):
        """Verifies whether a database URI or configured URI is unambiguously a test database."""
        target_uri = (uri or cls.SQLALCHEMY_DATABASE_URI or '').lower()
        clean_path = target_uri.replace('\\', '/').split('?')[0]
        filename = clean_path.rsplit('/', 1)[-1] if '/' in clean_path else clean_path
        
        # Absolute rule: production / development database filenames are NEVER test databases
        if filename in ('latticelink.db', 'lattice_link.db'):
            return False
        if ':memory:' in target_uri:
            return True
        if 'test' in filename:
            return True
        return False

    @classmethod
    def assert_safe_for_destructive_action(cls, action_name="destructive operation", uri=None):
        """Hard safety guard: Refuses any destructive operation (e.g. drop_all, mass table delete)
        unless LATTICELINK_TEST_MODE is explicitly True AND target URI is a verified test database.
        """
        target_uri = uri or cls.SQLALCHEMY_DATABASE_URI or ''
        is_test_mode = os.getenv('LATTICELINK_TEST_MODE', 'False').lower() == 'true' or cls.LATTICELINK_TEST_MODE
        if not is_test_mode:
            raise RuntimeError(
                f"CRITICAL SAFETY VIOLATION: '{action_name}' refused! "
                f"LATTICELINK_TEST_MODE is not enabled. Active target: {target_uri}"
            )
        if not cls.is_test_database(target_uri):
            raise RuntimeError(
                f"CRITICAL SAFETY VIOLATION: '{action_name}' refused! "
                f"Target database is NOT a designated test database: {target_uri}"
            )
    
    # Upload storage
    UPLOAD_FOLDER = os.getenv('UPLOAD_DIR', os.path.join(BASE_DIR, 'uploads'))
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_FILE_SIZE', 200 * 1024 * 1024)) # 200 MB default
    ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'txt,pdf,png,jpg,jpeg,gif,zip,tar,rar,gz,mp3,mp4,webm,enc').split(','))
    
    # Session lifetime (1 hour)
    SESSION_TIMEOUT = int(os.getenv('SESSION_EXPIRY', 3600))
    
    # Frontend URL included in OTP email footers
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # Server settings
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
