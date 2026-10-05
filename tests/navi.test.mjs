import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { configuration, DEFAULTS, locations, normalize, playback, player, reserve, status, updateConfiguration } from '../scripts/navi.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts', 'navi.mjs');
const json = path => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'agent navi '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const env = { ...process.env, AGENT_NAVI_CONFIG: join(root, 'config.json'), AGENT_NAVI_STATE_DIR: join(root, 'state'), AGENT_NAVI_MUTE: '0' };
  delete env.AGENT_NAVI_AUDIO_DIR;
  return { root, env, settings: () => configuration(env) };
}

test('host payloads map to shared events and shell/edit approval cues', () => {
  for (const agent of ['claude', 'codex']) {
    for (const [native, event] of [['SessionStart', 'session_started'], ['UserPromptSubmit', 'prompt_submitted'], ['PermissionRequest', 'approval_required'], ['Stop', 'turn_completed']]) {
      assert.equal(normalize({ hook_event_name: native, session_id: 'one' }, agent).event, event);
    }
    for (const tool_name of ['Bash', 'PowerShell', 'apply_patch', 'Write', 'Edit', 'NotebookEdit']) assert.equal(normalize({ hook_event_name: 'PermissionRequest', tool_name }, agent).change, true);
    assert.equal(normalize({ hook_event_name: 'PermissionRequest', tool_name: 'WebFetch' }, agent).change, false);
    assert.equal(normalize({ hook_event_name: 'PreToolUse', tool_name: 'Bash' }, agent), null);
  }
  const notification = normalize({ hook_event_name: 'Notification', notification_type: 'permission_prompt' }, 'claude');
  assert.equal(notification.event, 'approval_required');
  assert.equal(notification.change, false);
  assert.equal(notification.fallback, true);
  for (const notification_type of ['elicitation_dialog', 'elicitation_url_dialog', 'agent_needs_input']) assert.equal(normalize({ hook_event_name: 'Notification', notification_type }, 'claude').event, 'input_required');
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'idle_prompt' }, 'claude').event, 'ready_for_input');
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'idle_prompt' }, 'codex'), null);
  assert.equal(normalize({ hook_event_name: 'StopFailure' }, 'claude').event, 'error');
  assert.equal(normalize({ hook_event_name: 'StopFailure' }, 'codex'), null);
});

test('subagent completion, compaction, unknown payloads, and continuing Stop stay silent', () => {
  for (const payload of [null, [], 'text', {}, { hook_event_name: 'Unknown' }, { hook_event_name: 'SubagentStop' }, { hook_event_name: 'SessionStart', source: 'compact' }, { hook_event_name: 'SessionStart', agent_id: 'child' }, { hook_event_name: 'Stop', agent_id: 'child' }, { hook_event_name: 'Stop', stop_hook_active: true }]) assert.equal(normalize(payload, 'claude'), null);
  assert.equal(normalize({ hook_event_name: 'PermissionRequest', agent_id: 'child' }, 'claude').event, 'approval_required');
});

test('config preserves defaults, merges event overrides, and resolves user audio outside plugins', t => {
  const f = fixture(t);
  assert.deepEqual(f.settings().config.events, DEFAULTS.events);
  writeFileSync(f.env.AGENT_NAVI_CONFIG, JSON.stringify({ muted: true, audioDir: './my audio', events: { prompt_submitted: { clips: ['look'] }, turn_completed: { enabled: true } } }));
  const { config } = f.settings();
  assert.equal(config.muted, false); // Environment override wins.
  assert.equal(config.audioDir, join(f.root, 'my audio'));
  assert.deepEqual(config.events.prompt_submitted.clips, ['look']);
  assert.equal(config.events.turn_completed.enabled, true);
  assert.equal(config.events.error.enabled, false);
  assert.equal(configuration({ ...f.env, AGENT_NAVI_AUDIO_DIR: join(f.root, 'override') }).config.audioDir, join(f.root, 'override'));
});

test('invalid config and invalid sound names are rejected by diagnostics', t => {
  const f = fixture(t);
  for (const value of [[], { unknown: true }, { muted: 'yes' }, { cooldownMs: -1 }, { events: null }, { events: { unknown: {} } }, { events: { session_started: { clips: [] } } }, { events: { session_started: { clips: ['../outside'] } } }, { events: { session_started: { enabled: 'yes' } } }, JSON.parse('{"events":{"__proto__":{"enabled":true}}}')]) {
    writeFileSync(f.env.AGENT_NAVI_CONFIG, JSON.stringify(value));
    assert.throws(f.settings);
  }
  writeFileSync(f.env.AGENT_NAVI_CONFIG, '{');
  assert.throws(f.settings);
});

test('configuration uses native Windows and XDG paths', () => {
  assert.equal(locations({ APPDATA: '/roaming', LOCALAPPDATA: '/local' }, 'win32').config, resolve('/roaming/agent-navi/config.json'));
  assert.equal(locations({ XDG_CONFIG_HOME: '/config', XDG_STATE_HOME: '/state' }, 'linux').state, resolve('/state/agent-navi'));
});

test('platform players prefer native backends and treat Windows filenames as data', () => {
  const audio = "C:/my audio/it's $safe.wav";
  assert.deepEqual(player(audio, 'darwin', () => true), ['afplay', audio]);
  assert.equal(player(audio, 'linux', name => name === 'pw-play')[0], 'pw-play');
  assert.equal(player(audio, 'linux', name => name === 'aplay')[0], 'aplay');
  assert.equal(player(audio, 'linux', () => true)[0], 'paplay');
  assert.deepEqual(player(audio, 'linux', name => name === 'ffplay'), ['ffplay', '-nodisp', '-autoexit', '-loglevel', 'quiet', audio]);
  const windows = player(audio, 'win32', () => true);
  assert.equal(windows[0], 'powershell.exe');
  assert.ok(windows.at(-1).includes('$env:AGENT_NAVI_PLAY_FILE'));
  assert.ok(!windows.at(-1).includes(audio));
  for (const platform of ['darwin', 'linux', 'win32', 'unknown']) assert.equal(player(audio, platform, () => false), null);
});

test('global playback lock, per-session cooldown, delayed approvals, and stale recovery', t => {
  const f = fixture(t);
  const { paths, config } = f.settings();
  const event = { agent: 'claude', session: 'private-session-name', event: 'approval_required' };
  const release = reserve(paths, event, config, 10000);
  assert.equal(typeof release, 'function');
  assert.equal(reserve(paths, { ...event, session: 'other' }, config, 10100), null);
  release();
  assert.equal(reserve(paths, event, config, 10500), null);
  assert.equal(reserve(paths, { ...event, fallback: true }, config, 16000), null);
  reserve(paths, { ...event, session: 'other' }, config, 10500)();
  reserve(paths, event, config, 21000)();
  const lock = join(paths.state, 'playback.lock');
  mkdirSync(lock);
  utimesSync(lock, new Date(0), new Date(0));
  reserve(paths, event, config, 50000)();
});

test('playback obeys mute, event toggles, custom clips, and tool approval mapping', t => {
  const f = fixture(t);
  const settings = f.settings();
  settings.config.cooldownMs = 0;
  const played = [];
  const options = { player: audio => ['fake-player', audio], run: (command, args, opts) => { played.push({ command, args, opts }); return { status: 0 }; } };
  const event = { agent: 'generic', session: 'one', event: 'prompt_submitted' };
  settings.config.events.prompt_submitted.clips = ['look'];
  assert.equal(playback(event, settings, options), true);
  assert.equal(played[0].args[0], join(ROOT, 'audio', 'look.wav'));
  assert.equal(played[0].opts.timeout, 10000);
  assert.equal(playback({ ...event, event: 'approval_required', change: true }, settings, options), true);
  assert.equal(played[1].args[0], join(ROOT, 'audio', 'watchout.wav'));
  assert.equal(playback({ ...event, event: 'turn_completed' }, settings, options), false);
  settings.config.muted = true;
  assert.equal(playback(event, settings, options), false);
  assert.equal(played.length, 2);
});

test('missing audio, missing players, and player errors release state and report failures', t => {
  const f = fixture(t);
  const settings = f.settings();
  const event = { agent: 'generic', session: 'one', event: 'session_started' };
  assert.throws(() => playback(event, settings, { player: () => null }), /player/);
  settings.config.audioDir = join(f.root, 'missing');
  assert.throws(() => playback(event, settings), /Missing audio/);
  settings.config.audioDir = join(ROOT, 'audio');
  settings.config.cooldownMs = 0;
  assert.throws(() => playback(event, settings, { player: () => ['fake'], run: () => ({ status: 1 }) }), /failed/);
  assert.equal(playback(event, settings, { player: () => ['fake'], run: () => ({ status: 0 }) }), true);
});

test('hook failures never block; Codex Stop emits only neutral JSON', t => {
  const f = fixture(t);
  const env = { ...f.env, AGENT_NAVI_MUTE: '1' };
  for (const agent of ['claude', 'codex']) {
    for (const input of ['bad json', '[]', '{}', '{"hook_event_name":"Unknown"}', '{"hook_event_name":"SessionStart"}']) {
      const result = spawnSync(process.execPath, [SCRIPT, 'hook', '--agent', agent], { input, env, encoding: 'utf8', timeout: 3000 });
      assert.equal(result.status, 0);
      assert.equal(result.stdout, '');
      assert.equal(result.stderr, '');
    }
  }
  writeFileSync(f.env.AGENT_NAVI_CONFIG, '{');
  const stop = spawnSync(process.execPath, [SCRIPT, 'hook', '--agent', 'codex'], { input: '{"hook_event_name":"Stop"}', env, encoding: 'utf8', timeout: 3000 });
  assert.equal(stop.status, 0);
  assert.deepEqual(JSON.parse(stop.stdout), {});
  assert.equal(stop.stderr, '');
});

test('CLI diagnostics report problems, generic events respect mute, and previews validate names', t => {
  const f = fixture(t);
  const run = args => spawnSync(process.execPath, [SCRIPT, ...args], { env: { ...f.env, AGENT_NAVI_MUTE: '1', AGENT_NAVI_AUDIO_DIR: join(f.root, 'missing') }, encoding: 'utf8', timeout: 3000 });
  assert.deepEqual(JSON.parse(run(['config']).stdout), DEFAULTS);
  assert.equal(run(['play', 'approval_required', '--tool', 'Bash', '--session', 'one']).status, 0);
  assert.equal(run(['play', 'unknown']).status, 1);
  assert.equal(run(['preview', 'unknown']).status, 1);
  assert.match(run(['preview', 'hello']).stderr, /Missing audio/);
  assert.match(run(['doctor']).stdout, /missing hello/);
  assert.equal(run(['doctor']).status, 1);
});

test('npm console entry works through a symlink', { skip: process.platform === 'win32' }, t => {
  const f = fixture(t);
  const bin = join(f.root, 'agent-navi');
  symlinkSync(SCRIPT, bin);
  const result = spawnSync(process.execPath, [bin, 'config'], { env: f.env, encoding: 'utf8', timeout: 3000 });
  assert.deepEqual(JSON.parse(result.stdout), DEFAULTS);
});

test('both hosts execute registered commands with spaces and shell metacharacters in plugin paths', t => {
  const f = fixture(t);
  const pluginRoot = join(f.root, "Navi's $folder (test)");
  mkdirSync(join(pluginRoot, 'scripts'), { recursive: true });
  copyFileSync(SCRIPT, join(pluginRoot, 'scripts', 'navi.mjs'));
  copyFileSync(join(ROOT, 'scripts', 'pet.mjs'), join(pluginRoot, 'scripts', 'pet.mjs'));
  const env = { ...f.env, AGENT_NAVI_MUTE: '1', PLUGIN_ROOT: pluginRoot, CLAUDE_PLUGIN_ROOT: pluginRoot };
  for (const agent of ['claude', 'codex']) {
    const hooks = json(`hooks/${agent}.json`).hooks;
    for (const event of ['SessionStart', 'UserPromptSubmit', 'PermissionRequest', 'Stop']) {
      const hook = hooks[event][0].hooks[0];
      const options = { env, input: JSON.stringify({ hook_event_name: event, source: 'startup', session_id: 'test' }), encoding: 'utf8', timeout: 3000 };
      const result = agent === 'claude'
        ? spawnSync(hook.command, hook.args.map(arg => arg.replace('${CLAUDE_PLUGIN_ROOT}', pluginRoot)), options)
        : spawnSync(hook.command, { ...options, shell: true });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stderr, '');
      assert.equal(result.stdout, agent === 'codex' && event === 'Stop' ? '{}\n' : '');
    }
  }
});

test('metadata and host hook registrations stay consistent and load exactly one hook file', () => {
  const portable = json('plugin.json');
  const claude = json('.claude-plugin/plugin.json');
  const packageInfo = json('package.json');
  assert.equal(portable.name, claude.name);
  assert.equal(portable.version, claude.version);
  assert.equal(portable.version, packageInfo.version);
  assert.equal(json('.claude-plugin/marketplace.json').name, 'agent-navi');
  assert.equal(json('.agents/plugins/marketplace.json').name, 'agent-navi');
  assert.equal(claude.hooks, './hooks/claude.json');
  assert.equal(portable.extensions['com.openai'].hooks, './hooks/codex.json');
  for (const agent of ['claude', 'codex']) {
    const hooks = json(`hooks/${agent}.json`).hooks;
    assert.ok(!hooks.PreToolUse && !hooks.SubagentStop);
    assert.ok(hooks.PermissionRequest && hooks.Stop);
    for (const groups of Object.values(hooks)) for (const group of groups) {
      assert.equal(group.hooks.length, 1);
      assert.equal(group.hooks[0].type, 'command');
    }
  }
  assert.ok(!json('hooks/codex.json').hooks.Notification);
});

test('Gemini lifecycle and permission notifications use explicit host contracts', () => {
  for (const [native, expected] of [['SessionStart', 'session_started'], ['BeforeAgent', 'prompt_submitted'], ['AfterAgent', 'turn_completed']]) {
    assert.equal(normalize({ hook_event_name: native, session_id: 'gemini-session' }, 'gemini').event, expected);
  }
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'ToolPermission', details: { tool_name: 'run_shell_command' } }, 'gemini').change, true);
  assert.equal(normalize({ hook_event_name: 'Notification', notification_type: 'ToolPermission' }, 'gemini').event, 'approval_required');
  for (const payload of [{ hook_event_name: 'Notification', notification_type: 'permission_prompt' }, { hook_event_name: 'SessionStart', source: 'compact' }, { hook_event_name: 'AfterAgent', stop_hook_active: true }, { hook_event_name: 'PermissionRequest' }]) assert.equal(normalize(payload, 'gemini'), null);
});

test('Gemini hooks always return neutral JSON without exposing input or errors', t => {
  const f = fixture(t);
  writeFileSync(f.env.AGENT_NAVI_CONFIG, '{');
  for (const input of ['bad json', '[]', '{}', '{"hook_event_name":"AfterAgent","prompt":"private"}']) {
    const result = spawnSync(process.execPath, [SCRIPT, 'hook', '--agent', 'gemini'], { env: f.env, input, encoding: 'utf8', timeout: 3000 });
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), {});
    assert.equal(result.stderr, '');
  }
});

test('corrupted disposable timestamps recover without losing subsequent cooldown', t => {
  const f = fixture(t);
  const { paths, config } = f.settings();
  const event = { agent: 'generic', session: 'one', event: 'session_started' };
  reserve(paths, event, config, 10000)();
  const key = createHash('sha256').update('generic:one:session_started').digest('hex');
  const stamp = join(paths.state, `${key}.json`);
  for (const corrupt of ['{', 'null']) {
    writeFileSync(stamp, corrupt);
    reserve(paths, event, config, 20000)();
    assert.deepEqual(JSON.parse(readFileSync(stamp, 'utf8')), { time: 20000 });
    assert.equal(reserve(paths, event, config, 20500), null);
    assert.deepEqual(readdirSync(paths.state), [`${key}.json`]);
  }
});

test('previews bypass event cooldown, leave timestamps alone, and retain overlap protection', t => {
  const f = fixture(t);
  const settings = f.settings();
  settings.config.cooldownMs = 60000;
  const event = { agent: 'generic', session: 'one', event: 'session_started' };
  const options = { player: () => ['fake-player'], run: () => ({ status: 0 }) };
  assert.equal(playback(event, settings, options), true);
  const before = readdirSync(settings.paths.state).map(name => readFileSync(join(settings.paths.state, name), 'utf8'));
  assert.equal(playback(event, settings, { ...options, clip: 'hey', preview: true }), true);
  assert.equal(playback(event, settings, { ...options, clip: 'look', preview: true }), true);
  assert.deepEqual(readdirSync(settings.paths.state).map(name => readFileSync(join(settings.paths.state, name), 'utf8')), before);
  const release = reserve(settings.paths, event, settings.config, Date.now(), true);
  assert.equal(playback(event, settings, { ...options, preview: true }), false);
  release();
});

test('persistent controls preserve custom clips and make environment precedence visible', t => {
  const f = fixture(t);
  const env = { ...f.env }; delete env.AGENT_NAVI_MUTE;
  writeFileSync(env.AGENT_NAVI_CONFIG, JSON.stringify({ audioDir: './my audio', cooldownMs: 2500, events: { prompt_submitted: { clips: ['look'] } } }));
  updateConfiguration('mute', 'prompt_submitted', env);
  assert.equal(configuration(env).config.events.prompt_submitted.enabled, false);
  updateConfiguration('mute', 'all', env);
  updateConfiguration('unmute', 'all', env);
  assert.equal(configuration(env).config.muted, false);
  assert.equal(configuration(env).config.events.prompt_submitted.enabled, false);
  updateConfiguration('unmute', 'prompt_submitted', env);
  updateConfiguration('preset', 'attention', env);
  let current = configuration(env).config;
  assert.equal(current.events.session_started.enabled, false);
  assert.equal(current.events.ready_for_input.enabled, true);
  assert.deepEqual(current.events.prompt_submitted.clips, ['look']);
  assert.equal(current.cooldownMs, 2500);
  assert.equal(JSON.parse(readFileSync(env.AGENT_NAVI_CONFIG)).audioDir, './my audio');
  updateConfiguration('preset', 'default', env);
  assert.equal(configuration(env).config.events.prompt_submitted.enabled, true);
  updateConfiguration('unmute', 'all', { ...env, AGENT_NAVI_MUTE: '1' });
  assert.equal(status({ ...env, AGENT_NAVI_MUTE: '1' }).config.muted, true);
  assert.equal(status({ ...env, AGENT_NAVI_MUTE: '1' }).environmentOverrides.AGENT_NAVI_MUTE, '1');
  const before = readFileSync(env.AGENT_NAVI_CONFIG, 'utf8');
  for (const [command, target] of [['mute', undefined], ['unmute', 'typo'], ['preset', 'typo']]) assert.throws(() => updateConfiguration(command, target, env));
  assert.equal(readFileSync(env.AGENT_NAVI_CONFIG, 'utf8'), before);
  writeFileSync(env.AGENT_NAVI_CONFIG, '{');
  assert.throws(() => updateConfiguration('mute', 'all', env));
  assert.equal(readFileSync(env.AGENT_NAVI_CONFIG, 'utf8'), '{');
});

test('control CLI requires explicit targets and prints effective configuration', t => {
  const f = fixture(t);
  const env = { ...f.env }; delete env.AGENT_NAVI_MUTE;
  const run = args => spawnSync(process.execPath, [SCRIPT, ...args], { env, encoding: 'utf8', timeout: 3000 });
  assert.equal(run(['mute']).status, 1);
  assert.equal(run(['mute', 'typo']).status, 1);
  assert.equal(run(['mute', 'all']).status, 0);
  assert.equal(JSON.parse(run(['status', '--json']).stdout).config.muted, true);
  assert.equal(JSON.parse(run(['config', '--effective']).stdout).muted, true);
  assert.ok(JSON.parse(run(['list', '--json']).stdout).clips.includes('listen'));
  assert.equal(run(['unmute', 'all']).status, 0);
});
