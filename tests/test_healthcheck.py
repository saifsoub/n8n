import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class HealthcheckTests(unittest.TestCase):
    def check_health(self, curl_code, docker_code=0):
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            for name, code in (("curl", curl_code), ("docker", docker_code)):
                command = work / name
                command.write_text('#!/bin/sh\nprintf "%s\\n" "$@" >> "$CHECK_ARGS/' + name + '"\nexit ' + str(code) + '\n')
                command.chmod(0o755)
            args = work / "args"
            args.mkdir()
            env = {**os.environ, "PATH": f'{work}:{os.environ["PATH"]}', "CHECK_ARGS": str(args),
                   "N8N_URL": "http://localhost:5678/"}
            result = subprocess.run(["bash", str(ROOT / "scripts/healthcheck.sh")],
                                    cwd=work, env=env, capture_output=True, text=True)
            return result, {p.name: p.read_text().splitlines() for p in args.iterdir()}

    def test_unavailable_readiness_fails_even_with_running_containers(self):
        result, _ = self.check_health(22)
        self.assertNotEqual(result.returncode, 0, result.stdout)

    def test_ready_checks_database_readiness_with_bounded_timeouts(self):
        result, args = self.check_health(0)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("http://localhost:5678/healthz/readiness", args["curl"])
        self.assertIn("--connect-timeout", args["curl"])
        self.assertIn("--max-time", args["curl"])
        self.assertIn(str(ROOT / "docker-compose.local.yml"), args["docker"])

    def test_container_inspection_failure_is_not_hidden(self):
        result, _ = self.check_health(0, 1)
        self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
