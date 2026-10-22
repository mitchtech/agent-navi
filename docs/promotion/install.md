# From install to first cue

Agent Navi is free to try. Sounds require Node.js 22+ on the agent's PATH and
local audio: `afplay` on macOS, a supported Linux player, or Windows PowerShell
on Windows. Remote hooks play on the remote machine unless an audio bridge is
already configured. This guide does not change your pet selection.

## Claude Code

Run in a terminal:

```bash
claude plugin marketplace add mitchtech/agent-navi
claude plugin install navi@agent-navi
```

Restart Claude Code. In a disposable project, request a harmless operation that
requires approval under your existing permission settings. An eligible request
should produce a cue. Do not weaken permissions to make the demonstration work.
If your policy already approves the operation, it will not demonstrate an
approval request. Use the explicit preview below to check audio separately.

## Codex

```bash
codex plugin marketplace add mitchtech/agent-navi
codex plugin add navi@agent-navi
```

Review and trust the installed hooks in Codex's hook settings, then restart.
Repeat the harmless approval check under your normal permission settings.
Installing or enabling the plugin alone does not establish hook trust.

## Diagnose and preview without a global install

The bundled control skill supports requests such as "check Navi's sound
status," "mute Navi," and "Navi, use the attention preset." For an explicit
terminal preview, use the repository CLI:

```bash
git clone https://github.com/mitchtech/agent-navi.git
cd agent-navi
node scripts/navi.mjs doctor
node scripts/navi.mjs preview hey
```

`doctor` does not play audio or change settings. `preview` explicitly plays a
clip even when muted; it is an audio check, not proof that a host hook fired.
The preview respects overlap prevention. These commands need no npm install.

To keep only attention-related events:

```bash
node scripts/navi.mjs preset attention
node scripts/navi.mjs status
```

The attention preset turns off session, prompt, completion, and error cues.
Approval, question, and ready events remain enabled where the host exposes
them. Codex does not have native question/idle mappings in v0.4.0.

```bash
node scripts/navi.mjs mute all
node scripts/navi.mjs unmute all
node scripts/navi.mjs preset default
```

Mute/unmute preserves individual event preferences. The default preset restores
event enablement and preserves global mute and custom clip choices.

## Remove sounds

Use the command for the host you installed:

```bash
claude plugin uninstall navi@agent-navi
```

```bash
codex plugin remove navi@agent-navi
```

Restart the host. These remove the sound plugin, not an independently installed
pet. Persistent sound settings are stored separately from plugin caches.

## Optional pet

Download [the pet ZIP](https://github.com/mitchtech/agent-navi/releases/latest/download/agent-navi-pet.zip).
Extract `navi` into `~/.codex/pets/`, or `pets/` inside your configured
`CODEX_HOME`. Preserve existing files if that folder already exists. Refresh
the compatible host's pet picker and choose Navi yourself. No Node.js is needed
for the ZIP, and the ZIP does not enable sound hooks.

Desktop and terminal pet support differ. Follow the
[pet guide](../pets.md) for supported terminals, conflicts, and removal.

If a check fails, report the host/version, operating system, expected event,
and redacted diagnostic error through [GitHub Issues](https://github.com/mitchtech/agent-navi/issues).
Do not include prompts, transcripts, credentials, or private configuration.
