import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { installPet, petPath, petStatus, uninstallPet } from '../scripts/pet.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE = join(ROOT, 'pets', 'navi');
const SCRIPT = join(ROOT, 'scripts', 'navi.mjs');

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "Navi's $pet "));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const env = { ...process.env, CODEX_HOME: join(root, 'codex'), AGENT_NAVI_CONFIG: join(root, 'invalid.json') };
  return { root, env, target: petPath(env) };
}

test('pet installation is independent, identical, repeatable, and removable', t => {
  const { env, target } = fixture(t);
  mkdirSync(env.CODEX_HOME, { recursive: true });
  const config = join(env.CODEX_HOME, 'config.toml');
  writeFileSync(config, '[desktop]\nselected-avatar-id = "another-pet"\n');
  assert.equal(petStatus(env).state, 'not-installed');
  assert.equal(installPet(env).changed, true);
  assert.equal(petStatus(env).managed, true);
  for (const name of ['pet.json', 'spritesheet.webp', 'LICENSE.txt', 'NOTICE.md']) assert.deepEqual(readFileSync(join(target, name)), readFileSync(join(BUNDLE, name)));
  assert.equal(installPet(env).changed, false);
  assert.match(readFileSync(config, 'utf8'), /another-pet/);
  assert.deepEqual(readdirSync(join(env.CODEX_HOME, 'pets')), ['navi']);
  assert.equal(uninstallPet(env).changed, true);
  assert.equal(uninstallPet(env).changed, false);
  assert.ok(existsSync(config));
});

test('the existing local or manually extracted bundle remains unmanaged and unchanged', t => {
  const { env, target } = fixture(t);
  mkdirSync(target, { recursive: true });
  for (const name of ['pet.json', 'spritesheet.webp']) copyFileSync(join(BUNDLE, name), join(target, name));
  assert.equal(installPet(env).changed, false);
  assert.equal(petStatus(env).managed, false);
  assert.throws(() => uninstallPet(env), /unmanaged/);
  assert.deepEqual(readdirSync(target).sort(), ['pet.json', 'spritesheet.webp']);
});

test('conflicting files require replacement and the complete previous directory is backed up', t => {
  const { env, target } = fixture(t);
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'pet.json'), 'my custom pet');
  writeFileSync(join(target, 'personal.txt'), 'keep this too');
  assert.throws(() => installPet(env), /--replace/);
  assert.equal(readFileSync(join(target, 'pet.json'), 'utf8'), 'my custom pet');
  const result = installPet(env, true);
  assert.equal(result.state, 'matching');
  assert.equal(readFileSync(join(result.backup, 'personal.txt'), 'utf8'), 'keep this too');
  assert.equal(readFileSync(join(result.backup, 'pet.json'), 'utf8'), 'my custom pet');
});

test('uninstall protects modified files, unknown files, and corrupt ownership records', t => {
  const { env, target } = fixture(t);
  installPet(env);
  writeFileSync(join(target, 'personal.txt'), 'keep');
  assert.throws(() => uninstallPet(env), /changed/);
  rmSync(join(target, 'personal.txt'));
  writeFileSync(join(target, 'pet.json'), 'edited');
  assert.throws(() => uninstallPet(env), /changed/);
  copyFileSync(join(BUNDLE, 'pet.json'), join(target, 'pet.json'));
  writeFileSync(join(target, '.agent-navi.json'), '{');
  assert.throws(() => uninstallPet(env), /unmanaged/);
  assert.ok(existsSync(join(target, 'spritesheet.webp')));
});

test('pet paths that are files or symbolic links are never replaced', t => {
  const { root, env, target } = fixture(t);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, 'keep');
  assert.throws(() => installPet(env, true), /regular directory/);
  assert.equal(readFileSync(target, 'utf8'), 'keep');
  if (process.platform !== 'win32') {
    rmSync(target);
    const elsewhere = join(root, 'elsewhere');
    mkdirSync(elsewhere);
    writeFileSync(join(elsewhere, 'personal.txt'), 'keep');
    symlinkSync(elsewhere, target);
    assert.throws(() => installPet(env, true), /regular directory/);
    assert.throws(() => uninstallPet(env), /unmanaged/);
    assert.ok(existsSync(join(elsewhere, 'personal.txt')));
  }
});

test('pet CLI and doctor work without audio players or valid audio configuration', t => {
  const { env } = fixture(t);
  writeFileSync(env.AGENT_NAVI_CONFIG, '{');
  const run = args => spawnSync(process.execPath, [SCRIPT, ...args], { env, encoding: 'utf8', timeout: 5000 });
  assert.equal(run(['doctor', '--pet']).status, 1);
  assert.equal(run(['pet', 'install']).status, 0);
  assert.equal(run(['doctor', '--pet']).status, 0);
  assert.equal(JSON.parse(run(['pet', 'status', '--json']).stdout).state, 'matching');
  assert.equal(run(['pet', 'install', '--unknown']).status, 1);
  assert.equal(run(['pet', 'unknown']).status, 1);
  assert.equal(run(['pet', 'uninstall']).status, 0);
});

test('an incomplete package fails before replacement and cleans its temporary files', async t => {
  const { root, env, target } = fixture(t);
  const copy = join(root, 'package');
  mkdirSync(join(copy, 'scripts'), { recursive: true });
  mkdirSync(join(copy, 'pets', 'navi'), { recursive: true });
  copyFileSync(join(ROOT, 'scripts', 'pet.mjs'), join(copy, 'scripts', 'pet.mjs'));
  for (const name of ['pet.json', 'spritesheet.webp', 'NOTICE.md']) copyFileSync(join(BUNDLE, name), join(copy, 'pets', 'navi', name));
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'personal.txt'), 'keep');
  const incomplete = await import(pathToFileURL(join(copy, 'scripts', 'pet.mjs')).href);
  assert.throws(() => incomplete.installPet(env, true), /ENOENT/);
  assert.equal(readFileSync(join(target, 'personal.txt'), 'utf8'), 'keep');
  assert.deepEqual(readdirSync(dirname(target)), ['navi']);
});

test('missing required bundle files cannot make an empty target appear healthy', async t => {
  const { root, env, target } = fixture(t);
  const copy = join(root, 'empty-package');
  mkdirSync(join(copy, 'scripts'), { recursive: true });
  mkdirSync(join(copy, 'pets', 'navi'), { recursive: true });
  copyFileSync(join(ROOT, 'scripts', 'pet.mjs'), join(copy, 'scripts', 'pet.mjs'));
  mkdirSync(target, { recursive: true });
  const incomplete = await import(pathToFileURL(join(copy, 'scripts', 'pet.mjs')).href);
  assert.throws(() => incomplete.petStatus(env), /Incomplete pet bundle/);
  assert.throws(() => incomplete.installPet(env, true), /Incomplete pet bundle/);
  assert.deepEqual(readdirSync(target), []);
});
