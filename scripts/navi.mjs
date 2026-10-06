#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { petMain, petStatus, printPetStatus } from './pet.mjs';

const SCRIPT = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SCRIPT), '..');
const CLIPS = ['hello', 'hey', 'listen', 'look', 'watchout'];
const CHANGES = new Set(['Bash', 'PowerShell', 'Write', 'Edit', 'NotebookEdit', 'apply_patch', 'run_shell_command', 'write_file', 'replace']);
export const DEFAULTS = {
  muted: false,
  audioDir: null,
  cooldownMs: 1000,
  events: {
    session_started: { enabled: true, clips: ['hello'] },
    prompt_submitted: { enabled: true, clips: ['hey', 'look'] },
    approval_required: { enabled: true, clips: ['hey'], changeClips: ['watchout'] },
    input_required: { enabled: true, clips: ['listen'] },
    ready_for_input: { enabled: true, clips: ['listen'] },
    turn_completed: { enabled: false, clips: ['listen'] },
    error: { enabled: false, clips: ['watchout'] },
  },
};

export function locations(env = process.env, platform = process.platform) {
  const home = homedir();
  const configBase = platform === 'win32' ? env.APPDATA || join(home, 'AppData', 'Roaming') : env.XDG_CONFIG_HOME || join(home, '.config');
  const stateBase = platform === 'win32' ? env.LOCALAPPDATA || join(home, 'AppData', 'Local') : env.XDG_STATE_HOME || join(home, '.local', 'state');
  return {
    config: resolve(env.AGENT_NAVI_CONFIG || join(configBase, 'agent-navi', 'config.json')),
    state: resolve(env.AGENT_NAVI_STATE_DIR || join(stateBase, 'agent-navi')),
  };
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clips(value) {
  return Array.isArray(value) && value.length > 0 && value.every(clip => CLIPS.includes(clip));
}

export function configuration(env = process.env) {
  const paths = locations(env);
  const config = structuredClone(DEFAULTS);
  const overrides = existsSync(paths.config) ? JSON.parse(readFileSync(paths.config, 'utf8')) : {};
  if (!object(overrides) || Object.keys(overrides).some(key => !Object.hasOwn(config, key))) throw new Error('Unknown configuration field');
  for (const key of ['muted', 'audioDir', 'cooldownMs']) {
    if (Object.hasOwn(overrides, key)) config[key] = overrides[key];
  }
  if (typeof config.muted !== 'boolean' || (config.audioDir !== null && typeof config.audioDir !== 'string') || !Number.isFinite(config.cooldownMs) || config.cooldownMs < 0) throw new Error('Invalid configuration value');
  if (Object.hasOwn(overrides, 'events')) {
    if (!object(overrides.events)) throw new Error('events must be an object');
    for (const [event, settings] of Object.entries(overrides.events)) {
      const defaults = Object.hasOwn(config.events, event) ? config.events[event] : null;
      if (!defaults || !object(settings) || Object.keys(settings).some(key => !Object.hasOwn(defaults, key))) throw new Error(`Invalid settings for ${event}`);
      Object.assign(defaults, settings);
      if (typeof defaults.enabled !== 'boolean' || !clips(defaults.clips) || (defaults.changeClips && !clips(defaults.changeClips))) throw new Error(`Invalid sounds for ${event}`);
    }
  }
  if (env.AGENT_NAVI_MUTE !== undefined) {
    if (!['0', '1'].includes(env.AGENT_NAVI_MUTE)) throw new Error('AGENT_NAVI_MUTE must be 0 or 1');
    config.muted = env.AGENT_NAVI_MUTE === '1';
  }
  const audio = env.AGENT_NAVI_AUDIO_DIR || config.audioDir;
  config.audioDir = audio ? resolve(dirname(paths.config), audio) : join(ROOT, 'audio');
  return { config, paths };
}

// Temporary files live beside their destination so rename stays on the same filesystem.
function atomicWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    renameSync(temporary, path);
  } finally { rmSync(temporary, { force: true }); }
}

export function updateConfiguration(command, target, env = process.env) {
  // Validate existing preferences before writing; do not silently replace a broken user config.
  const { paths } = configuration(env);
  const value = existsSync(paths.config) ? JSON.parse(readFileSync(paths.config, 'utf8')) : {};
  if (command === 'preset') {
    if (!['default', 'attention'].includes(target)) throw new Error('Presets: default, attention');
    value.events ||= {};
    for (const [event, rule] of Object.entries(DEFAULTS.events)) {
      value.events[event] ||= {};
      value.events[event].enabled = target === 'attention'
        ? ['approval_required', 'input_required', 'ready_for_input'].includes(event) : rule.enabled;
    }
  } else {
    if (!['mute', 'unmute'].includes(command)) throw new Error('Unknown configuration action');
    if (target === 'all') value.muted = command === 'mute';
    else {
      if (!Object.hasOwn(DEFAULTS.events, target)) throw new Error(`Specify an event or all: ${Object.keys(DEFAULTS.events).join(', ')}`);
      value.events ||= {};
      value.events[target] ||= {};
      value.events[target].enabled = command === 'unmute';
    }
  }
  atomicWrite(paths.config, value);
  return configuration(env);
}

export function status(env = process.env) {
  const settings = configuration(env);
  return { ...settings, environmentOverrides: Object.fromEntries(
    ['AGENT_NAVI_MUTE', 'AGENT_NAVI_AUDIO_DIR', 'AGENT_NAVI_CONFIG', 'AGENT_NAVI_STATE_DIR']
      .filter(key => env[key] !== undefined).map(key => [key, env[key]])) };
}

function printStatus(settings) {
  console.log(`Config: ${settings.paths.config}`);
  console.log(`Muted: ${settings.config.muted}${Object.hasOwn(settings.environmentOverrides, 'AGENT_NAVI_MUTE') ? ' (AGENT_NAVI_MUTE overrides the saved preference)' : ''}`);
  for (const [event, rule] of Object.entries(settings.config.events)) console.log(`${event}: ${rule.enabled ? rule.clips.join('/') : 'off'}`);
}

export function normalize(payload, agent) {
  if (!object(payload)) return null;
  const native = payload.hook_event_name;
  if (agent === 'gemini') {
    let event;
    if (native === 'SessionStart' && (!payload.source || ['startup', 'resume', 'clear'].includes(payload.source))) event = 'session_started';
    else if (native === 'BeforeAgent') event = 'prompt_submitted';
    else if (native === 'AfterAgent' && !payload.stop_hook_active) event = 'turn_completed';
    else if (native === 'Notification' && payload.notification_type === 'ToolPermission') event = 'approval_required';
    return event ? { event, agent, session: typeof payload.session_id === 'string' ? payload.session_id : 'default',
      change: CHANGES.has(payload.details?.tool_name), fallback: false } : null;
  }
  // Only SessionStart/Stop suppress identified subagents; their approval prompts still need attention.
  if (['SessionStart', 'Stop'].includes(native) && payload.agent_id) return null;
  let event;
  let fallback = false;
  if (native === 'SessionStart') {
    if (payload.source && !['startup', 'resume', 'clear'].includes(payload.source)) return null;
    event = 'session_started';
  } else if (native === 'UserPromptSubmit') event = 'prompt_submitted';
  else if (native === 'PermissionRequest') event = 'approval_required';
  else if (native === 'Stop' && !payload.stop_hook_active) event = 'turn_completed';
  else if (agent === 'claude' && native === 'StopFailure') event = 'error';
  else if (agent === 'claude' && native === 'Notification') {
    if (payload.notification_type === 'permission_prompt') {
      event = 'approval_required';
      fallback = true;
    } else if (payload.notification_type === 'idle_prompt') event = 'ready_for_input';
    else if (['elicitation_dialog', 'elicitation_url_dialog', 'agent_needs_input'].includes(payload.notification_type)) event = 'input_required';
  }
  return event ? { event, agent, session: typeof payload.session_id === 'string' ? payload.session_id : 'default', change: CHANGES.has(payload.tool_name), fallback } : null;
}

function executable(command, env) {
  const result = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', [command], { env, stdio: 'ignore', timeout: 2000, windowsHide: true });
  return result.status === 0;
}

export function player(audio, platform = process.platform, available = command => executable(command, process.env)) {
  if (platform === 'darwin') return available('afplay') ? ['afplay', audio] : null;
  if (platform === 'win32') {
    if (!available('powershell.exe')) return null;
    // The filename is data in an environment variable, never PowerShell source.
    return ['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', '$p = New-Object System.Media.SoundPlayer; $p.SoundLocation = $env:AGENT_NAVI_PLAY_FILE; $p.PlaySync()'];
  }
  if (platform === 'linux') {
    for (const command of ['paplay', 'pw-play', 'aplay']) if (available(command)) return [command, audio];
    if (available('ffplay')) return ['ffplay', '-nodisp', '-autoexit', '-loglevel', 'quiet', audio];
  }
  return null;
}

export function reserve(paths, event, config, now = Date.now(), preview = false) {
  mkdirSync(paths.state, { recursive: true, mode: 0o700 });
  const lock = join(paths.state, 'playback.lock');
  try {
    mkdirSync(lock);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    // Playback is bounded to 10 seconds. Recover a lock abandoned by a killed worker.
    if (now - statSync(lock).mtimeMs < 30000) return null;
    rmSync(lock, { recursive: true, force: true });
    try { mkdirSync(lock); } catch { return null; }
  }
  const release = () => rmSync(lock, { recursive: true, force: true });
  try {
    if (preview) return release;
    const key = createHash('sha256').update(`${event.agent}:${event.session}:${event.event}`).digest('hex');
    const stamp = join(paths.state, `${key}.json`);
    let previous = {};
    if (existsSync(stamp)) {
      try { previous = JSON.parse(readFileSync(stamp, 'utf8')) || {}; } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        // Timestamps are disposable cache data, unlike the user's configuration.
      }
    }
    const interval = event.fallback ? Math.max(10000, config.cooldownMs) : config.cooldownMs;
    if (Number.isFinite(previous.time) && now - previous.time < interval) {
      release();
      return null;
    }
    atomicWrite(stamp, { time: now });
    // State stores hashes and timestamps only. Remove inactive session records after a day.
    for (const name of readdirSync(paths.state)) {
      if (/^[a-f0-9]{64}\.json$/.test(name) && now - statSync(join(paths.state, name)).mtimeMs > 86400000) rmSync(join(paths.state, name));
    }
    return release;
  } catch (error) {
    release();
    throw error;
  }
}

export function playback(event, settings, options = {}) {
  const { config, paths } = settings;
  const rule = config.events[event.event];
  if (!rule || config.muted || !rule.enabled) return false;
  const choices = event.change && rule.changeClips ? rule.changeClips : rule.clips;
  const clip = options.clip || choices[Math.floor(Math.random() * choices.length)];
  if (!CLIPS.includes(clip)) throw new Error('Unknown clip');
  const audio = join(config.audioDir, `${clip}.wav`);
  if (!existsSync(audio)) throw new Error(`Missing audio: ${audio}`);
  const command = (options.player || player)(audio);
  if (!command) throw new Error('No supported audio player found; run agent-navi doctor');
  const release = reserve(paths, event, config, Date.now(), options.preview === true);
  if (!release) return false;
  try {
    const result = (options.run || spawnSync)(command[0], command.slice(1), {
      stdio: 'ignore', timeout: 10000, windowsHide: true,
      env: { ...process.env, AGENT_NAVI_PLAY_FILE: audio },
    });
    if (result.error || result.status !== 0) throw new Error('Audio player failed');
    return true;
  } finally { release(); }
}

function schedule(event) {
  const child = spawn(process.execPath, [SCRIPT, '_play', JSON.stringify(event)], {
    detached: true, stdio: 'ignore', windowsHide: true,
  });
  child.on('error', () => {});
  child.unref();
}

function doctor() {
  const settings = configuration();
  const { config, paths } = settings;
  console.log(`Agent Navi | Node ${process.version} | ${process.platform}`);
  console.log(`Config: ${paths.config} (${existsSync(paths.config) ? 'loaded' : 'defaults'})`);
  console.log(`Audio: ${config.audioDir}`);
  console.log(`State: ${paths.state}`);
  console.log(`Muted: ${config.muted}`);
  const command = player(join(config.audioDir, 'hello.wav'));
  console.log(`Player: ${command ? command[0] : 'MISSING'}`);
  const missing = CLIPS.filter(clip => !existsSync(join(config.audioDir, `${clip}.wav`)));
  console.log(`Clips: ${missing.length ? `missing ${missing.join(', ')}` : 'all five available'}`);
  for (const [event, rule] of Object.entries(config.events)) console.log(`${event}: ${rule.enabled ? rule.clips.join('/') : 'off'}`);
  printPetStatus();
  return command && !missing.length ? 0 : 1;
}

export async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  const quiet = command === 'hook' || command === '_play';
  try {
    if (command === '_play') {
      playback(JSON.parse(args[0]), configuration());
      return 0;
    }
    if (command === 'pet') return petMain(args);
    if (command === 'doctor') {
      const { values } = parseArgs({ args, options: { pet: { type: 'boolean', default: false } } });
      if (values.pet) {
        const status = petStatus();
        printPetStatus(status);
        return status.state === 'matching' ? 0 : 1;
      }
      return doctor();
    }
    if (['status', 'config'].includes(command)) {
      const { values } = parseArgs({ args, options: { json: { type: 'boolean' }, effective: { type: 'boolean' } } });
      if (command === 'config' && !values.effective) {
        console.log(JSON.stringify(DEFAULTS, null, 2));
        return 0;
      }
      const current = status();
      if (command === 'config') console.log(JSON.stringify(current.config, null, 2));
      else if (values.json) console.log(JSON.stringify(current, null, 2));
      else printStatus(current);
      return 0;
    }
    if (['mute', 'unmute', 'preset'].includes(command)) {
      if (args.length !== 1) throw new Error(`Usage: agent-navi ${command} ${command === 'preset' ? 'default|attention' : 'EVENT|all'}`);
      updateConfiguration(command, args[0]);
      printStatus(status());
      return 0;
    }
    if (command === 'list') {
      const { values } = parseArgs({ args, options: { json: { type: 'boolean' } } });
      const catalog = { clips: CLIPS, events: Object.keys(DEFAULTS.events), presets: ['default', 'attention'] };
      console.log(values.json ? JSON.stringify(catalog, null, 2) : Object.entries(catalog).map(([key, items]) => `${key}: ${items.join(', ')}`).join('\n'));
      return 0;
    }
    if (command === 'hook') {
      const { values } = parseArgs({ args, options: { agent: { type: 'string' } } });
      if (!['claude', 'codex', 'gemini'].includes(values.agent)) throw new Error('Specify --agent claude, codex, or gemini');
      // Gemini always receives neutral JSON, including malformed-input/config paths.
      if (values.agent === 'gemini') console.log('{}');
      let input = '';
      process.stdin.setEncoding('utf8');
      for await (const chunk of process.stdin) {
        input += chunk;
        if (input.length > 1024 * 1024) return 0;
      }
      // Codex Stop accepts JSON output. An empty object never alters the agent's decisions.
      const payload = JSON.parse(input);
      if (values.agent === 'codex' && payload?.hook_event_name === 'Stop') console.log('{}');
      const event = normalize(payload, values.agent);
      const { config } = configuration();
      if (event && !config.muted && config.events[event.event].enabled) schedule(event);
      return 0;
    }
    if (command === 'play' || command === 'preview') {
      const { values, positionals } = parseArgs({ args, allowPositionals: true, options: { session: { type: 'string', default: 'default' }, tool: { type: 'string' } } });
      if (positionals.length !== 1) throw new Error(`Usage: agent-navi ${command} ${command === 'play' ? 'EVENT' : 'CLIP'}`);
      const settings = configuration();
      const event = { event: positionals[0], agent: 'generic', session: values.session, change: CHANGES.has(values.tool) };
      if (command === 'preview') {
        if (!CLIPS.includes(positionals[0])) throw new Error(`Clips: ${CLIPS.join(', ')}`);
        event.event = 'session_started';
        settings.config.muted = false;
        settings.config.events.session_started.enabled = true;
        if (!playback(event, settings, { clip: positionals[0], preview: true })) {
          console.error('Agent Navi: another sound is playing; try the preview again.');
          return 1;
        }
      } else {
        if (!Object.hasOwn(DEFAULTS.events, event.event)) throw new Error(`Events: ${Object.keys(DEFAULTS.events).join(', ')}`);
        playback(event, settings);
      }
      return 0;
    }
    if (command && !['--help', '-h'].includes(command)) throw new Error(`Unknown command: ${command}`);
    console.log('Agent Navi\n\nagent-navi hook --agent claude|codex|gemini\nagent-navi play EVENT [--session ID] [--tool TOOL]\nagent-navi preview hello|hey|listen|look|watchout\nagent-navi pet install [--replace]\nagent-navi pet status [--json]\nagent-navi pet uninstall\nagent-navi doctor [--pet]\nagent-navi config [--effective]\nagent-navi status [--json]\nagent-navi mute EVENT|all\nagent-navi unmute EVENT|all\nagent-navi preset default|attention\nagent-navi list [--json]');
    return 0;
  } catch (error) {
    if (!quiet) console.error(`Agent Navi: ${error.message}`);
    return quiet ? 0 : 1;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === SCRIPT) process.exitCode = await main();
