const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const buildScript = path.join(root, 'scripts', 'build-upload.ps1');
const auditScript = path.join(root, 'scripts', 'preflight-upload.ps1');

test('packager creates an upload ZIP that passes extracted-package audit', () => {
  assert.ok(fs.existsSync(buildScript), 'build-upload.ps1 is missing');
  assert.ok(fs.existsSync(auditScript), 'preflight-upload.ps1 is missing');

  const zipPath = path.join(os.tmpdir(), `moon-leaks-${process.pid}.zip`);
  const build = spawnSync('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', buildScript, '-OutputPath', zipPath,
  ], { encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr || build.stdout);

  const audit = spawnSync('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', auditScript, '-ZipPath', zipPath,
  ], { encoding: 'utf8' });
  assert.equal(audit.status, 0, audit.stderr || audit.stdout);
  assert.match(audit.stdout, /UPLOAD_PREFLIGHT=PASS/);
  assert.ok(fs.statSync(zipPath).size < 2 * 1024 * 1024);

  fs.unlinkSync(zipPath);
});
