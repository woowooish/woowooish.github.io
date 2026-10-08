"""Offline regressions for partial HTTP responses and retained release evidence."""
import http.client
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

source = Path(os.environ.get('WOO_LIVE_SCRIPT', Path(__file__).with_name('check-live.py')))
spec = importlib.util.spec_from_file_location('live_check', source)
live = importlib.util.module_from_spec(spec)
spec.loader.exec_module(live)

class ReleaseEvidence(unittest.TestCase):
    def run_case(self, mode):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ['index.html', 'robots.txt', 'sitemap.xml']:
                (root / name).write_text('SYNTHETIC ' + name)
            calls = {'files': 0, 'missing': 0}
            def fetch(path, release):
                if path.startswith('/release-verification-missing-'):
                    calls['missing'] += 1
                    if mode == 'missing-timeout':
                        raise TimeoutError('SYNTHETIC timeout')
                    if mode == 'wrong-status':
                        return b'WooWooish', {}
                    if mode == 'partial-404' and calls['missing'] == 1:
                        class Broken(io.BytesIO):
                            def read(self, *args):
                                raise http.client.IncompleteRead(b'Woo', 20)
                        stream = Broken()
                    else:
                        stream = io.BytesIO(b'SYNTHETIC WooWooish 404')
                    raise urllib.error.HTTPError(path, 404, 'Not Found', {}, stream)
                calls['files'] += 1
                if mode == 'always-partial' or (mode == 'partial-once' and calls['files'] == 1):
                    raise http.client.IncompleteRead(b'SYNTHETIC', 50)
                return (root / path.lstrip('/')).read_bytes(), {}
            status = 0
            with patch.object(live, 'ROOT', root), patch.object(live, 'fetch', fetch), \
                 patch.object(live.subprocess, 'check_output', return_value='a' * 40), \
                 patch.object(live.time, 'sleep'), patch('builtins.print'), \
                 patch.dict(os.environ, {'GITHUB_STEP_SUMMARY': str(root / 'summary.md')}):
                try:
                    live.main()
                except SystemExit as error:
                    status = error.code
            result = json.loads((root / 'audit-evidence/live-verification.json').read_text())
            self.assertEqual(result['commit'], 'a' * 40)
            self.assertTrue((root / 'summary.md').is_file())
            return status, result, calls

    def test_complete_response(self):
        status, result, calls = self.run_case('normal')
        self.assertEqual(status, 0)
        self.assertEqual(result['status'], 'PASS')
        self.assertEqual(result['verified_files'], 3)
        self.assertTrue(result['branded_404'])
        self.assertEqual(calls['missing'], 1)

    def test_partial_response_retries(self):
        status, result, calls = self.run_case('partial-once')
        self.assertEqual(status, 0)
        self.assertEqual(result['status'], 'PASS')
        self.assertEqual(calls['files'], 4)

    def test_persistent_partial_response_retains_failure(self):
        status, result, calls = self.run_case('always-partial')
        self.assertEqual(status, 1)
        self.assertEqual(result['status'], 'FAIL')
        self.assertEqual(calls['files'], 15)
        self.assertIn('IncompleteRead', result['failures'][0]['reason'])

    def test_partial_404_body_retries(self):
        status, result, calls = self.run_case('partial-404')
        self.assertEqual(status, 0)
        self.assertEqual(result['status'], 'PASS')
        self.assertEqual(calls['missing'], 2)

    def test_missing_route_timeout_retains_failure(self):
        status, result, calls = self.run_case('missing-timeout')
        self.assertEqual(status, 1)
        self.assertEqual(result['status'], 'FAIL')
        self.assertEqual(calls['missing'], 15)
        self.assertEqual(result['failures'][0]['path'], 'missing-route')

    def test_wrong_status_is_not_a_branded_404(self):
        status, result, calls = self.run_case('wrong-status')
        self.assertEqual(status, 1)
        self.assertFalse(result['branded_404'])
        self.assertEqual(calls['missing'], 15)

if __name__ == '__main__':
    unittest.main()
