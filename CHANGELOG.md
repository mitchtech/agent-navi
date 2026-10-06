# Changelog

## 0.4.0 - 2026-10-05

- Add a self-contained Gemini CLI extension sharing the portable runtime.
- Add persistent event mute/unmute, status, clip/event listing, and attention/default presets.
- Bundle a model-invocable Navi control skill for supported agents.
- Separate Claude ready notifications from input requests while preserving defaults. Existing input_required overrides apply to questions; configure ready_for_input separately for idle notifications.
- Recover malformed cooldown timestamps and write them atomically.
- Make previews bypass event cooldown and report overlap suppression.
- Reject incomplete bundled pet files instead of reporting a false matching state.
- Add an ffplay fallback for Linux audio.
- Validate installed npm packages and packaged Gemini hooks in CI.
- Add tag/version-checked releases, stable download assets, and release-based Pages builds.
- Generate site version links and preview every animation and look direction.
- Add contributor guidance and refresh completed design documentation.
- Archive the original pet byte-for-byte; remove the isolated moving-left fragment and enlarge the 16 directional frames 1.5x with a reproducible lossless repair.
- Add a validated nine-row web atlas with separate download and upload guidance.
- Restyle the site, social card, and README with self-hosted OFL fonts and a forest-night palette; add an SVG favicon, touch icon, and README banner.
- Add a Day theme that follows the operating system or a saved toggle, a themed 404 page, and accessibility fixes: WCAG AA contrast in both themes, announced animation states, a keyboard-scrollable compatibility table, and screen-reader-friendly labels.
- Ship every README preview image in the package and verify them in the package check.
- Compare regenerated previews by pixel in releases, since PNG bytes vary with each platform's zlib.

## 0.3.0 - 2026-10-04

- Include the original Navi v2 pet, preserving the manifest and sprite bytes.
- Keep sound and pet installation fully independent.
- Add pet install, status, uninstall, and pet-only diagnostics.
- Preserve existing avatar selection and back up explicitly replaced pet folders.
- Protect manual, modified, and additional files during removal.
- Add artwork licensing and provenance separate from code and audio.
- Publish a reproducible pet ZIP with checksums.
- Add animated previews, a static project site, and GitHub Pages deployment.
- Validate the atlas and installation across the existing OS/Node CI matrix.
- Document native pet compatibility and local versus web format differences.


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
