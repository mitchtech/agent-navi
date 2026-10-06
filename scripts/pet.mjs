import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const BUNDLE = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'pets', 'navi');
const FILES = ['pet.json', 'spritesheet.webp', 'LICENSE.txt', 'NOTICE.md'];
const MARKER = '.agent-navi.json';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export function petPath(env = process.env) {
  return resolve(env.CODEX_HOME || join(homedir(), '.codex'), 'pets', 'navi');
}

function regular(path) {
  try { return lstatSync(path).isFile(); } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function hashes(directory) {
  return Object.fromEntries(FILES.map(name => [name, regular(join(directory, name)) ? hash(readFileSync(join(directory, name))) : null]));
}

function owned(directory) {
  if (!regular(join(directory, MARKER))) return false;
  try {
    const marker = JSON.parse(readFileSync(join(directory, MARKER), 'utf8'));
    const actual = hashes(directory);
    return marker.owner === 'agent-navi' && FILES.every(name => actual[name] && marker.files?.[name] === actual[name])
      && readdirSync(directory).every(name => FILES.includes(name) || name === MARKER);
  } catch { return false; }
}

export function petStatus(env = process.env) {
  const path = petPath(env);
  let entry;
  try { entry = lstatSync(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return { id: 'navi', path, state: 'not-installed', managed: false };
  }
  if (!entry.isDirectory() || entry.isSymbolicLink()) return { id: 'navi', path, state: 'conflict', managed: false };
  const actual = hashes(path);
  const expected = hashes(BUNDLE);
  // The original local bundle has only the two host files. Notices are optional for matching it.
  if (!expected['pet.json'] || !expected['spritesheet.webp']) throw new Error('Incomplete pet bundle: required manifest or sprite sheet is missing');
  const matching = FILES.every(name => actual[name] === expected[name] || (!actual[name] && !['pet.json', 'spritesheet.webp'].includes(name)));
  return { id: 'navi', path, state: matching ? 'matching' : 'modified', managed: owned(path), spriteVersionNumber: matching ? 2 : null };
}

export function installPet(env = process.env, replace = false) {
  const status = petStatus(env);
  if (status.state === 'matching') return { ...status, changed: false };
  if (status.state === 'conflict') throw new Error(`Pet path is not a regular directory: ${status.path}`);
  if (status.state !== 'not-installed' && !replace) throw new Error(`Different pet files at ${status.path}; use --replace to keep a backup and install Navi`);
  const parent = dirname(status.path);
  mkdirSync(parent, { recursive: true });
  const temporary = mkdtempSync(join(parent, '.agent-navi-'));
  let backup;
  try {
    for (const name of FILES) writeFileSync(join(temporary, name), readFileSync(join(BUNDLE, name)));
    writeFileSync(join(temporary, MARKER), `${JSON.stringify({ owner: 'agent-navi', files: hashes(temporary) }, null, 2)}\n`);
    if (status.state !== 'not-installed') {
      backup = `${status.path}.backup-${temporary.split('.agent-navi-').at(-1)}`;
      renameSync(status.path, backup);
    }
    renameSync(temporary, status.path);
  } catch (error) {
    if (backup && !existsSync(status.path)) renameSync(backup, status.path);
    throw error;
  } finally { rmSync(temporary, { recursive: true, force: true }); }
  return { ...petStatus(env), changed: true, ...(backup ? { backup } : {}) };
}

export function uninstallPet(env = process.env) {
  const status = petStatus(env);
  if (status.state === 'not-installed') return { ...status, changed: false };
  if (!status.managed) throw new Error(`Refusing to remove unmanaged or changed files at ${status.path}; inspect and remove them manually`);
  // Move out of the live pet directory before removing only the verified owned bundle.
  const temporary = mkdtempSync(join(dirname(status.path), '.agent-navi-remove-'));
  try {
    const retired = join(temporary, 'navi');
    renameSync(status.path, retired);
    if (!owned(retired)) {
      renameSync(retired, status.path);
      throw new Error('Pet files changed during removal; nothing was deleted');
    }
    rmSync(retired, { recursive: true });
  } finally {
    // A failed restoration must preserve the retired directory for manual recovery.
    if (readdirSync(temporary).length === 0) rmSync(temporary, { recursive: true });
  }
  return { ...petStatus(env), changed: true };
}

export function printPetStatus(status = petStatus()) {
  console.log(`Pet: ${status.state} (${status.path})`);
  console.log(`Pet ownership: ${status.managed ? 'managed by agent-navi' : 'unmanaged'}`);
  console.log(status.state === 'matching'
    ? 'Select: refresh the desktop pet picker, or enter /pets Navi in a supported Codex CLI terminal'
    : 'Install: agent-navi pet install (optional; independent of sounds)');
  return ['matching', 'not-installed'].includes(status.state) ? 0 : 1;
}

export function petMain(argv) {
  const [command, ...args] = argv;
  if (!command || ['--help', '-h'].includes(command)) {
    console.log('agent-navi pet install [--replace]\nagent-navi pet status [--json]\nagent-navi pet uninstall');
    return 0;
  }
  const options = command === 'install' ? { replace: { type: 'boolean', default: false } }
    : command === 'status' ? { json: { type: 'boolean', default: false } } : {};
  const { values } = parseArgs({ args, options });
  let status;
  if (command === 'install') status = installPet(process.env, values.replace);
  else if (command === 'status') status = petStatus();
  else if (command === 'uninstall') status = uninstallPet();
  else throw new Error(`Unknown pet command: ${command}`);
  if (values.json) console.log(JSON.stringify(status, null, 2));
  else {
    if (status.changed !== undefined) console.log(status.changed ? 'Pet files updated.' : 'No pet files changed.');
    if (status.backup) console.log(`Previous pet preserved: ${status.backup}`);
    return printPetStatus(status);
  }
  return ['matching', 'not-installed'].includes(status.state) ? 0 : 1;
}
