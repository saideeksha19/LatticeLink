import os
import sys

# Ensure all discovered tests execute strictly against the isolated test database
os.environ['LATTICELINK_TEST_MODE'] = 'True'
test_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'latticelink_test.db')
os.environ['DATABASE_URL'] = f"sqlite:///{test_db_path.replace(os.sep, '/')}"

# Dummy email provider configuration for tests. The provider HTTP call is
# mocked below, so nothing is ever sent and no real key is required or used.
os.environ.setdefault('BREVO_API_KEY', 'test-dummy-brevo-api-key')
os.environ.setdefault('MAIL_DEFAULT_SENDER', 'latticelink.test.sender@gmail.com')

import unittest
from unittest.mock import patch, MagicMock

# Mock out external network calls to the email provider so tests run instantly,
# deterministically, and without consuming quota.
_provider_response = MagicMock()
_provider_response.status = 201
_provider_response.getcode.return_value = 201
_provider_response.read.return_value = b'{"messageId": "test-message-id"}'
_provider_response.close.return_value = None

_provider_urlopen = MagicMock(return_value=_provider_response)
_provider_urlopen.return_value.__enter__.return_value = _provider_response
_provider_urlopen.return_value.__exit__.return_value = False

patcher = patch('services.email_service.urllib.request.urlopen', _provider_urlopen)
mock_provider_http = patcher.start()

if __name__ == '__main__':
    loader = unittest.TestLoader()
    suite = loader.discover('tests', pattern='test_*.py')
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    patcher.stop()
    sys.exit(0 if result.wasSuccessful() else 1)
