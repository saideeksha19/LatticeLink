import os
import sys

# Ensure all discovered tests execute strictly against the isolated test database
os.environ['LATTICELINK_TEST_MODE'] = 'True'
test_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'latticelink_test.db')
os.environ['DATABASE_URL'] = f"sqlite:///{test_db_path.replace(os.sep, '/')}"

import unittest
from unittest.mock import patch

# Mock out external network SMTP calls so tests run instantly and deterministically
patcher = patch('services.email_service.smtplib.SMTP')
mock_smtp = patcher.start()

if __name__ == '__main__':
    loader = unittest.TestLoader()
    suite = loader.discover('tests', pattern='test_*.py')
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    patcher.stop()
    sys.exit(0 if result.wasSuccessful() else 1)
