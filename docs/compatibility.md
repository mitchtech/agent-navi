# Compatibility

Agent Navi uses a portable root `plugin.json` identity and separate host hook
registrations. Native integrations share `scripts/navi.mjs`; no runtime packages
are required beyond Node.js 22 or newer.

## Event coverage

| Shared event | Claude Code | Codex | Gemini CLI | Generic interface |
|---|---|---|---|---|
| Session started | `SessionStart`: startup, resume, clear | Same | `SessionStart` | `play session_started` |
| Prompt submitted | `UserPromptSubmit` | Same | `BeforeAgent` | `play prompt_submitted` |
| Approval required | `PermissionRequest`, delayed `Notification.permission_prompt` fallback | `PermissionRequest` | `Notification.ToolPermission` | `play approval_required` |
| Input required | `Notification`: elicitation_dialog, elicitation_url_dialog, agent_needs_input | No native mapping in this release | No native mapping | `play input_required` |
| Ready for input | `Notification.idle_prompt` | No native mapping | No native mapping | `play ready_for_input` |
| Turn completed | `Stop`, optional | `Stop`, optional | `AfterAgent`, optional | `play turn_completed` |
| Error | `StopFailure`, optional | No native mapping in this release | No native mapping | `play error` |

The current Codex hook documentation does not list Claude's `Notification` or
`StopFailure` events. Agent Navi does not infer questions from assistant prose
or inspect transcripts. Other agents can map their own notifications to the
generic interface. Gemini CLI has a separately packaged native extension;
OpenCode uses the generic interface in this release.

Shell/file-change approval cues recognize `Bash`, `PowerShell`, `Write`, `Edit`,
`NotebookEdit`, Codex's `apply_patch`, and Gemini's `run_shell_command`,
`write_file`, and `replace` when a notification supplies tool identity. Other tools use the general approval
sound. Classification uses tool identity, not command analysis. An MCP tool
that writes data is not automatically classified as a file-change tool.

The documented Claude permission notification has no tool details, so its
fallback uses Hey!; `PermissionRequest` supplies the tool-aware cue. A delayed
fallback within 10 seconds of an approval cue is silent. Independent rapid
approval events can be suppressed by the configured cooldown or an active clip.

`PreToolUse` and `SubagentStop` are not registered. `Stop` means the main agent
finished responding, not necessarily that the entire task succeeded. Continuing
Stop hooks (`stop_hook_active`) and identified subagent SessionStart/Stop payloads
are ignored. Approvals from subagents still need attention and remain eligible.
Compaction does not play Hello!.

## Host packaging

- Claude loads `.claude-plugin/plugin.json`, which references only `hooks/claude.json`.
- Codex loads root `plugin.json`, whose `extensions.com.openai.hooks` references only `hooks/codex.json`.
- Each host has its own marketplace named `agent-navi`, exposing plugin `navi`.
- The source package has no default `hooks/hooks.json`, avoiding double discovery. Only the generated Gemini extension contains that filename.
- Gemini substitutes `${extensionPath}` into a hook environment variable and the bootstrap reads it as data. See [Gemini packaging](gemini.md).
- Claude's exec-form arguments preserve paths with spaces and shell metacharacters.
- Codex's Node bootstrap reads `PLUGIN_ROOT` from the environment, so plugin paths remain data rather than shell source on all operating systems.
- Hook handlers return promptly and launch a detached, output-free playback worker.
- Codex requires hook trust review. Agent Navi never supplies allow/deny decisions.

The shared root manifest follows [Agent Plugins 1.0.0](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json).
Host-specific packaging remains necessary; the portable schema does not make
every host event available everywhere.

## Operating systems

| OS | Audio backend | Notes |
|---|---|---|
| macOS | `afplay` | Built in |
| Linux | `paplay`, then `pw-play`, then `aplay`, then `ffplay` | Install at least one; requires access to a local audio server/device |
| Windows | `powershell.exe` and `System.Media.SoundPlayer` | No Bash; use PCM WAV |

Node must be on the hook process's PATH. Restart desktop agents after installing
Node or changing PATH. Playback is capped at 10 seconds; overlapping sounds are
dropped, and abandoned locks recover after 30 seconds. Preview commands wait
for playback; hooks do not.

WSL is a Linux environment and needs a working Linux audio bridge. SSH,
containers, cloud execution, and IDE remote sessions do not automatically route
audio to your local speakers. This plugin does not deploy a relay or service.

## Native pet compatibility

Sounds and pets install independently. The `navi` plugin registers sound hooks
only; the pet CLI or ZIP installs a local custom pet without hook registration
or avatar selection changes. The host drives pet activity and animation.

| Surface | Sounds | Native pet |
|---|---|---|
| Claude Code | Native hooks | No integration provided |
| Gemini CLI | Native extension | No integration provided |
| Codex desktop | With trusted hooks | Compatible custom pet picker |
| Codex CLI | Native hooks | Graphics-capable terminal required |
| Codex IDE extension | Depends on host hook support | No picker or overlay |
| Other agents and scripts | Generic event interface | Depends on host; no adapter provided |
| Headless or remote environments | Requires local audio access | No local display is implied |

The original local v2 atlas includes 73 animation/direction cells plus an
optional neutral-look cell, leaving 14 empty cells. Asset validation checks the
manifest, transparency, cell occupancy, and original hashes. Installer tests
check filesystem behavior rather than native rendering support on every OS.
See [pet installation and host limitations](pets.md).

## Validation and support baseline

The baseline uses Claude Code 2.1.289 and Codex CLI 0.160.0. Gemini hook
environment fields were checked against its released v0.62.0 source.
Payload fixture tests cover the documented event contracts. CI runs the shared
runtime on Node 22/24 across macOS, Linux, and Windows, with simulated players.
Physical speaker playback and desktop PATH/trust configuration still depend
on each user's environment. Passing fixtures is not a claim of live end-to-end
testing on every OS and agent surface.

Sources checked October 4, 2026:

- [Gemini hook reference](https://geminicli.com/docs/hooks/reference/)
- [Gemini extension releases](https://geminicli.com/docs/extensions/releasing/)
- [Claude hook reference](https://code.claude.com/docs/en/hooks)
- [Claude plugin manifest reference](https://code.claude.com/docs/en/plugins-reference)
- [Codex hook reference](https://learn.chatgpt.com/docs/hooks)
- [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins)
- [OpenAI public submission limitations](https://developers.openai.com/plugins/deploy/submission)

OpenAI currently excludes lifecycle-hook ZIPs from public submission. Use the
GitHub marketplace commands in the README for this release.
