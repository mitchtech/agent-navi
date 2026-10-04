# Changelog

## 0.2.0 - 2026-10-04

- Rename the project and marketplaces to Agent Navi / agent-navi.
- Add portable Agent Plugins metadata and native Codex packaging.
- Separate Claude Code and Codex event registrations.
- Replace Bash/jq playback with one dependency-free Node.js runtime.
- Support macOS, Linux, and Windows playback backends.
- Add generic events, mute controls, event sound overrides, and persistent user audio.
- Add preview, configuration, and diagnostic commands.
- Use native permission events for tool-aware approval alerts.
- Add optional completion/error sounds, cooldowns, and playback overlap prevention.
- Keep hook failures advisory and permission decisions untouched.
- Document event coverage, runtime requirements, migration, and audio provenance.
- Add automated tests and an OS/Node CI matrix.

Breaking changes: install as `navi@agent-navi`; Node.js 22+ replaces Bash/jq;
`scripts/play.sh` is replaced by `scripts/navi.mjs`. No old installation alias
is maintained.

## 0.1.0

- Initial Claude Code plugin with five Navi clips and macOS playback.
