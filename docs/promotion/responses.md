# Response sheet

Use these as factual starting points. Answer the person's question directly
and link only the relevant documentation.

**What is Agent Navi?** A free sound-notification plugin for coding agents, with
a separately installed Codex pet. Native sounds support Claude Code, Codex,
and Gemini CLI; other tools can call the shared event interface.

**Does Claude Code get a pet?** No pet integration is provided for Claude Code
or Gemini CLI. The native pet targets compatible Codex hosts. Installing sounds
never installs or selects it.

**Is it constantly talking?** Session, prompt, and attention events are enabled
by default where supported. Use the attention preset to silence session and
prompt cues, mute individual events, or mute everything. Completion and error
cues are off by default.

**What does the attention preset do?** It enables approval, question, and ready
notifications and disables session, prompt, completion, and error cues. Actual
event availability depends on the host. It preserves custom clips and global mute.

**Does it approve anything or change permissions?** No. The hooks provide cues,
never approval decisions. "Watch out!" identifies a shell/file-change approval
when tool identity is available; it is not a destructive-command classifier.

**Does it inspect my prompts or send telemetry?** It runs locally without
runtime telemetry. Hook input is used to map documented events; Agent Navi does
not log prompts/transcripts or infer questions from assistant prose. Local
playback state stores hashed identifiers and timestamps. The site loads no
analytics. GitHub and social platforms maintain their own aggregate metrics.

**Why do I hear nothing?** Check Node.js on the hook process's PATH, restart the
agent, verify the local audio player/device, and inspect the mute state. Codex
also requires hook trust review. Use `doctor` for diagnostics and `preview hey`
for an explicit audio check. A preview works even when saved settings are muted.

**Will it play on my laptop from SSH, WSL, or a container?** Not automatically.
Audio plays where the hook runs. A working audio bridge must already exist if
the execution environment and speakers are on different machines.

**Do all hosts expose the same events?** No. Claude has question/idle mappings
that Codex and Gemini lack in this release. Completion is optional, not a task
success detector. See [compatibility](../compatibility.md).

**Was every platform physically tested?** CI exercises Node 22/24 on macOS,
Linux, and Windows with simulated players. Package tests exercise installed
bundles. Neither proves physical speaker output or native pet rendering on
every surface. Current campaign checks are recorded in [validation](validation.md).

**Is this official Nintendo software?** No. Character rights and trademarks
remain with their owners. Code/configuration use MIT; contributor rights in pet
artwork use CC BY 4.0. The Nintendo-derived audio is excluded from both licenses,
and its provenance notice is not permission from Nintendo. See the
[audio notice](../../audio/NOTICE.md) and [pet notice](../../pets/navi/NOTICE.md).

**Can I use my own audio?** Yes. Configure your own audio directory with the five
expected WAV filenames, using 16-bit PCM WAV for player compatibility. Keep
custom files outside plugin caches. See [configuration](../../README.md#configuration).

**Is the pet animation synchronized by the sound plugin?** No. The host drives
the pet's animation/activity. The two installs are independent and no background
synchronization service runs.

**Can I remove it cleanly?** Uninstall the sound plugin through its host. Pet
removal is separate; CLI uninstall preserves edited or unmanaged pet files.
Use the [walkthrough](install.md) and [pet guide](../pets.md).
