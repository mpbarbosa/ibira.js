// __tests__/sync-version.test.js

const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = path.resolve(__dirname, '../../scripts/sync-version.js');

// Import pure functions directly via require (script guards execution with require.main === module)
const { parseVersion, generateVersionTs } = require(SCRIPT_PATH);

describe('parseVersion', () => {
  it('parses standard semver without prerelease', () => {
    expect(parseVersion('1.2.3')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: '',
    });
  });

  it('parses semver with prerelease', () => {
    expect(parseVersion('0.3.6-alpha')).toEqual({
      major: 0,
      minor: 3,
      patch: 6,
      prerelease: 'alpha',
    });
    expect(parseVersion('2.0.0-beta.1')).toEqual({
      major: 2,
      minor: 0,
      patch: 0,
      prerelease: 'beta.1',
    });
  });

  it('parses semver with complex prerelease', () => {
    expect(parseVersion('1.2.3-rc.1.2')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: 'rc.1.2',
    });
  });

  it('handles missing patch/minor as undefined', () => {
    expect(parseVersion('1.2')).toEqual({
      major: 1,
      minor: 2,
      patch: undefined,
      prerelease: '',
    });
    expect(parseVersion('1')).toEqual({
      major: 1,
      minor: undefined,
      patch: undefined,
      prerelease: '',
    });
  });

  it('handles empty string', () => {
    expect(parseVersion('')).toEqual({
      major: 0,
      minor: undefined,
      patch: undefined,
      prerelease: '',
    });
  });
});

describe('generateVersionTs', () => {
  it('generates version.ts content for release version', () => {
    const result = generateVersionTs({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: '',
    });
    expect(result).toContain('major: 1,');
    expect(result).toContain('minor: 2,');
    expect(result).toContain('patch: 3,');
    expect(result).toContain('prerelease: "",');
    expect(result).toContain('toString(): string {');
    expect(result).toContain('1.2.3');
    expect(result).not.toContain('1.2.3-');
  });

  it('generates version.ts content for prerelease version', () => {
    const result = generateVersionTs({
      major: 0,
      minor: 3,
      patch: 6,
      prerelease: 'alpha',
    });
    expect(result).toContain('major: 0,');
    expect(result).toContain('minor: 3,');
    expect(result).toContain('patch: 6,');
    expect(result).toContain('prerelease: "alpha",');
    expect(result).toContain('0.3.6-alpha');
  });

  it('includes correct example in JSDoc', () => {
    const result = generateVersionTs({
      major: 2,
      minor: 1,
      patch: 0,
      prerelease: 'beta.1',
    });
    expect(result).toContain('console.log(VERSION.toString()); // "2.1.0-beta.1"');
  });
});

describe('sync-version script integration', () => {
  const tempDir = path.join(__dirname, 'tmp-sync-version');
  const pkgPath = path.join(tempDir, 'package.json');
  const versionTsPath = path.join(tempDir, 'src', 'config', 'version.ts');
  // Place script in tempDir/scripts/ so __dirname/.. resolves to tempDir (matching project layout)
  const scriptPath = path.join(tempDir, 'scripts', 'sync-version.js');

  beforeAll(() => {
    fs.mkdirSync(path.join(tempDir, 'src', 'config'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'scripts'), { recursive: true });
    fs.writeFileSync(
      pkgPath,
      JSON.stringify({ version: '1.2.3-alpha' }, null, 2)
    );
    fs.writeFileSync(scriptPath, fs.readFileSync(SCRIPT_PATH, 'utf8'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes version.ts on normal run', () => {
    const { spawnSync } = require('child_process');
    const result = spawnSync('node', [scriptPath], {
      cwd: tempDir,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Synced version\.ts/);
    const content = fs.readFileSync(versionTsPath, 'utf8');
    expect(content).toContain('major: 1,');
    expect(content).toContain('prerelease: "alpha"');
  });

  it('exits 0 if version.ts is in sync (--check)', () => {
    const { spawnSync } = require('child_process');
    // First, ensure version.ts is in sync
    spawnSync('node', [scriptPath], { cwd: tempDir });
    const result = spawnSync('node', [scriptPath, '--check'], {
      cwd: tempDir,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/version\.ts is in sync/);
  });

  it('exits 1 if version.ts is out of sync (--check)', () => {
    const { spawnSync } = require('child_process');
    // Write an out-of-sync version.ts
    fs.writeFileSync(versionTsPath, '// out of sync');
    const result = spawnSync('node', [scriptPath, '--check'], {
      cwd: tempDir,
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/version\.ts is out of sync/);
    expect(result.stderr).toMatch(/Run: npm run version:sync/);
  });

  it('handles missing version.ts in --check mode', () => {
    const { spawnSync } = require('child_process');
    if (fs.existsSync(versionTsPath)) fs.unlinkSync(versionTsPath);
    const result = spawnSync('node', [scriptPath, '--check'], {
      cwd: tempDir,
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/version\.ts is out of sync/);
  });

  it('throws if package.json is missing', () => {
    const { spawnSync } = require('child_process');
    fs.unlinkSync(pkgPath);
    const result = spawnSync('node', [scriptPath], {
      cwd: tempDir,
      encoding: 'utf8',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/ENOENT/);
  });
});
