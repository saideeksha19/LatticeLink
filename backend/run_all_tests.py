import os
import sys

# Ensure all discovered tests execute strictly against the isolated test database
os.environ['LATTICELINK_TEST_MODE'] = 'True'
test_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'latticelink_test.db')
os.environ['DATABASE_URL'] = f"sqlite:///{test_db_path.replace(os.sep, '/')}"

# Dummy Resend credentials for tests. The Resend API call itself is mocked below,
# so nothing is ever sent and no real key is required or used.
os.environ.setdefault('RESEND_API_KEY', 'test-dummy-resend-api-key')
os.environ.setdefault('RESEND_FROM', 'LatticeLink Test <test@latticelink.test>')

import unittest
from unittest.mock import patch

# Mock out external network calls to the Resend API so tests run instantly,
# deterministically, and without consuming quota.
patcher = patch('services.email_service.resend.Emails.send', return_value={'id': 'test-email-id'})
mock_resend_send = patcher.start()

if __name__ == '__main__':
    loader = unittest.TestLoader()
    suite = loader.discover('tests', pattern='test_*.py')
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    patcher.stop()
    sys.exit(0 if result.wasSuccessful() else 1)
