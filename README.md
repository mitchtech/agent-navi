# Agent Navi

**Hey! Listen!**

Navi sound notifications for coding agents. Native integrations for **Claude
Code** and **Codex**, plus a small event interface for any other agent or script.
One shared player supports macOS, Linux, and Windows.

Agent Navi plays the five Navi voice clips from *The Legend of Zelda: Ocarina
of Time*. It runs locally, sends no telemetry, and never approves or blocks an
agent's actions. Inspired by [thephw/claude-meseeks](https://github.com/thephw/claude-meseeks).

## Requirements

- **Node.js 22 or newer**, with `node` on the agent's `PATH`.
- **macOS:** built-in `afplay`.
- **Linux:** `paplay`, `pw-play`, or `aplay`, with a working local audio device.
- **Windows:** Windows PowerShell (`powershell.exe`), using `System.Media.SoundPlayer`.

No npm runtime dependencies, Bash, or `jq` are required. Windows hooks and audio
playback do not require Git Bash. A headless machine without an audio device
cannot play sounds on your laptop automatically.

## Install

### Claude Code

```text
/plugin marketplace add mitchtech/agent-navi
/plugin install navi@agent-navi
```

### Codex

```bash
codex plugin marketplace add mitchtech/agent-navi
codex plugin add navi@agent-navi
```

Review and trust the installed hooks in Codex's hook settings before using them.
Installing or enabling the plugin does not automatically trust its hook commands.
Restart the agent after installation or updates.

### Local development

```bash
git clone https://github.com/mitchtech/agent-navi.git
cd agent-navi
node scripts/navi.mjs doctor
```

Use `/plugin marketplace add /absolute/path/to/agent-navi` in Claude Code or
`codex plugin marketplace add /absolute/path/to/agent-navi` in Codex, followed by
the same plugin installation command above.

### Standalone command

For the `agent-navi` command outside an agent plugin:

```bash
npm install -g github:mitchtech/agent-navi
agent-navi doctor
agent-navi play approval_required --session my-session --tool Bash
agent-navi preview listen
```

All commands also work as `node /path/to/agent-navi/scripts/navi.mjs ...`.
Standalone `play` and `preview` wait for the short clip; native hooks dispatch
playback to a detached worker so the agent can continue immediately.

## Sounds

| Shared event | Sound | Default |
|---|---|---|
| `session_started` | Hello! | On |
| `prompt_submitted` | Random Hey! / Look! | On |
| `approval_required` | Hey! | On |
| Approval for shell commands or file edits | Watch out! | On |
| `input_required` | Listen! | On where available |
| `turn_completed` | Listen! | Off |
| `error` | Watch out! | Off |

Watch out! is a cue for shell/file-change approvals, not a claim that the
operation is destructive. Subagent completion and context compaction are silent.
Idle/input notifications and completion events are distinct; event availability
depends on the host. See [compatibility](docs/compatibility.md).

## Configuration

Configuration stays outside plugin caches, so updates preserve your settings:

- macOS/Linux: `~/.config/agent-navi/config.json`, or `$XDG_CONFIG_HOME/agent-navi/config.json`.
- Windows: `%APPDATA%/agent-navi/config.json`.

Create the parent directory and save the settings you want to override:

```json
{
  "muted": false,
  "audioDir": "./audio",
  "cooldownMs": 1000,
  "events": {
    "prompt_submitted": { "clips": ["hey"] },
    "approval_required": { "clips": ["hey"], "changeClips": ["watchout"] },
    "turn_completed": { "enabled": true },
    "error": { "enabled": true }
  }
}
```

Omit `audioDir` to use bundled clips. Relative directories resolve from the
configuration file's directory. Custom audio directories must contain
`hello.wav`, `hey.wav`, `listen.wav`, `look.wav`, and `watchout.wav`; use 16-bit
PCM WAV for compatibility with all players. Copy the clips to your own directory
before replacing them. Installed plugin files can be overwritten by updates.

An event's `clips` array selects one sound randomly; use one entry for a fixed
sound. `changeClips` applies only to shell/file-change approvals. Each event
accepts `enabled: false` to mute it independently. `agent-navi config` prints
the complete default configuration without writing anything.

| Environment variable | Effect |
|---|---|
| `AGENT_NAVI_MUTE` | `1` mutes; `0` unmutes; overrides `muted` |
| `AGENT_NAVI_CONFIG` | Explicit configuration file path |
| `AGENT_NAVI_AUDIO_DIR` | Overrides the audio directory |
| `AGENT_NAVI_STATE_DIR` | Overrides the local playback state directory |

Configure environment variables before starting the agent. Agent Navi suppresses
repeated events within `cooldownMs` for the same agent/session/event. A global
playback lock drops overlapping clips across sessions. Claude's delayed
permission notification is suppressed for at least 10 seconds after a matching
approval alert; a network permission notification without a preceding alert can
still play. State contains hashed event/session identifiers and timestamps only,
and inactive records are cleaned up after a day when another sound plays.

## Other agents

Call the shared interface when your agent emits an attention event:

```bash
agent-navi play session_started --session example
agent-navi play prompt_submitted --session example
agent-navi play approval_required --session example --tool apply_patch
agent-navi play input_required --session example
```

Completion and error events honor their configuration toggles. Integration
scripts should treat playback failures as advisory. No tool-call or transcript
polling is needed.

## Troubleshooting

```bash
node scripts/navi.mjs doctor
node scripts/navi.mjs preview hello
```

`doctor` reports configuration, paths, player availability, clips, and enabled
events without playing anything. `preview` explicitly plays a clip even when
muted, but still respects overlap prevention. Neither command changes settings.

Native hooks exit successfully on malformed input, invalid configuration, missing
audio/player, or playback failure. They produce no prose or permission decisions.
Codex `Stop` emits only `{}` as neutral JSON required by that host. Run diagnostics
when sounds are missing, and check Node's availability and hook trust settings.

SSH, containers, WSL, and cloud sessions play on the machine executing the hook.
An audio bridge must already exist if you expect those sounds on another machine.
GitHub marketplace installation is the distribution path; this hook plugin is
not submitted to OpenAI's public plugin directory.

## Development

```bash
npm run check
npm test
npm pack --dry-run
```

Tests simulate players and cover host payloads, configuration, deduplication,
overlap, failures, paths with spaces, and packaging. CI runs Node 22 and 24 on
macOS, Linux, and Windows. See [compatibility](docs/compatibility.md),
[migration](docs/migration.md), and [release notes](CHANGELOG.md).

## Credits and license

- Author: [Michael J. Mitchell / mitchtech](https://github.com/mitchtech).
- Navi, *The Legend of Zelda: Ocarina of Time*: Nintendo.
- Original plugin inspiration: [thephw/claude-meseeks](https://github.com/thephw/claude-meseeks).

Code and configuration: [MIT](LICENSE). Bundled audio is excluded from that
license; see [audio provenance and rights notice](audio/NOTICE.md).
