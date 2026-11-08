# Changelog

## Unreleased

## 0.5.0 - 2026-11-07

Hey! Listen! for destructive commands, a heart meter for usage limits, and optional lifecycle cues, plus a demo video and links to the whole sibling family.

- Add a 512 px plugin listing icon, which `claude plugin validate` asks for.
- Link the sibling projects Agent Johnny 5, Agent Warcraft, Agent Rocky, Agent Star Wars, and Agent StarCraft in the README, site footer, and control skill.
- Document Claude Code installation with terminal `claude plugin` commands, matching Codex and Gemini CLI; the in-session `/plugin` form remains noted.
- Use the same unpinned Gemini CLI install command on the site as in the README.
- Play "Hey! Listen!" when an approval's command is destructive (`rm -rf`, force push, `git reset --hard`, `DROP TABLE`, and similar). Only a yes/no flag leaves the hook; the command is never stored. The new `hey-listen.wav` joins the original Hey! and Listen! samples, and `dangerClips` configures it. Custom audio directories now need `hey-listen.wav` too.
- Map Claude Code `StopFailure` usage errors (`rate_limit`, `billing_error`, `account_on_hold`) and `quota_auto_resume_disabled` to `out_of_hearts` (Hey! Listen!); other API errors keep the optional `error` cue. `quota_auto_resume_stale` plays `ready_for_input`.
- Add `agent-navi statusline`, a heart meter for Claude Code's status line that shows the tightest of the 5-hour, 7-day, and spend limits, or an optional `hearts.budgetUsd`, as five heart containers. It plays `hearts_low` (Watch out!) once per session at `hearts.lowPercent` and `out_of_hearts` at 100%.
- Add optional `tool_failed` (Claude `PostToolUseFailure`), `subagent_started` (Claude and Codex `SubagentStart`), `context_compacting` (`PreCompact`, Gemini `PreCompress`), and `session_ended` (`SessionEnd`) cues, off by default. The attention preset now also keeps the usage alarms on.
- Record every clip's origin and hash in `audio/sources.json`. `scripts/build-audio.py` rebuilds `hey-listen.wav` byte for byte from the original samples using only the Python standard library, and CI and releases run its offline `--check`. The five original recordings stay unmodified; unlike the sibling plugins, they are not loudness-normalized.
- Keep `LICENSE` as the standard MIT text so GitHub detects it; the audio and artwork exclusions remain in their notices and the README.
- Add a one-line summary under the README banner.
- Add a 36-second demo video of a real Claude Code session, with its sound cues, to the site, and a linked poster to the README. The media lives in `assets/demo` with its own notice.
- Document running Agent Navi alongside its sibling plugins, one sound plugin per host.

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
