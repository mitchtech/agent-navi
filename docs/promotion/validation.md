# Promotion validation

Checked October 16, 2026. Campaign publications have not started. No social
accounts were modified, no messages were sent, and no directory submissions
were made. Local evidence under `dist/promotion/` is ignored by Git.

## Initial observations

The authenticated GitHub snapshot was captured at 22:29:09 UTC before isolated
host installation checks. The repository had 1 star and 0 forks. The traffic
window reported 4 views / 3 unique visitors and 268 full clones / 77 unique
cloners. These are rolling aggregate counts that can include development and
automation; they are not active-user estimates.

Latest release: v0.4.0, published October 6, 2026 at 05:06:31 UTC.

| Release asset | Asset ID | Initial downloads |
|---|---|---|
| agent-navi-0.4.0.tgz | 614545653 | 0 |
| agent-navi-pet-v0.4.0.zip | 614545651 | 0 |
| agent-navi-pet-web.webp | 614545648 | 0 |
| agent-navi-pet.zip | 614545650 | 2 |
| agent-navi.tgz | 614545668 | 0 |
| darwin.agent-navi.zip | 614545669 | 1 |
| linux.agent-navi.zip | 614545673 | 0 |
| win32.agent-navi.zip | 614545674 | 0 |
| SHA256SUMS | 614545654 | 1 |

Source: [GitHub release](https://github.com/mitchtech/agent-navi/releases/tag/v0.4.0).
The full timestamped snapshot is in `dist/promotion/metrics/`. Traffic/referrer
details stay local. Two subsequent isolated marketplace installs cloned the
repository, and browser verification requested download headers; treat these
as validation activity, not campaign adoption.

## Public site and install checks

An isolated headless Chromium context checked the published Pages site at
1280 x 900 and 390 x 844. Evidence: `dist/promotion/browser/report.json` and
desktop/mobile screenshots.

- Site, sound/pet README destinations, and pet ZIP resolve with HTTP 200.
- Social image, sample GIF, WAV, and web atlas resolve with HTTP 200.
- All five audio-preview controls reach the browser's finished state.
- Sounds only, Pet only, and Both expose the expected panels.
- Claude command copy reaches the clipboard and displays confirmation.
- Theme control responds, reduced-motion disables animation, and the phone
  viewport has no horizontal page overflow. No page JavaScript errors occurred.

The published v0.4.0 site still displays Claude slash commands under text that
says to run commands in a terminal. The existing
[install-instructions PR](https://github.com/mitchtech/agent-navi/pull/3)
already corrects this. Campaign posts link the README install section and give
explicit terminal commands. This kit does not duplicate that separate PR.

Fresh marketplace add, plugin install, and plugin removal succeeded using
Claude Code 2.1.291 and Codex CLI 0.160.0 on macOS. Each host used a separate
temporary configuration directory under `/private/tmp/navi-promotion/host-installs`.
Playback was muted in that temporary environment. Existing host configurations,
hook trust, and pet selection were not changed. Evidence:
`dist/promotion/host-installs.json`.

## Automated checks

- `npm run check` passed.
- `npm test` passed all 28 tests.
- `npm run test:package` passed installed-tarball and Gemini execution checks.
- `python3 scripts/check-pet.py` passed, including original-byte preservation.
- `python3 scripts/build-assets.py --check` matched committed preview pixels.
- `python3 scripts/package-release.py` built local archives and checksums.
- `npm run site` built the local preview site.

Pillow 12.3.0 was already installed and matched `requirements-dev.txt`; no
dependency installation was needed. The local Node version was 23.11.0. The
existing CI matrix, rather than this workstation check, covers Node 22/24 and
multiple operating systems. Initial npm packaging attempts were blocked by
sandbox cache permissions; the same checks passed with cache access.

## Remaining native checks

All three promotional MP4s were inspected with FFprobe: expected durations
(24/12/12 seconds), 1080 x 1080 H.264/yuv420p video, AAC audio only in the
sound preview, and no audio tracks in the other two previews. Manifest source
and output hashes match the files. Local Markdown links resolve, and all four
X drafts fit within 280 characters even counting full URL lengths. The metrics
reader was checked with successful, HTTP-error, and missing-CLI responses;
unavailable data remains explicitly unavailable.

The following have not been verified by these automated/package/browser checks:

- Physical speaker output from an actual Claude Code approval request.
- Physical speaker output from an actual trusted Codex approval request.
- Native Codex pet rendering or activity transitions.
- End-to-end native behavior on Linux or Windows.

The committed MP4s are labeled illustrated previews, not proof of those checks.
Before publishing a claim of native behavior personally observed, complete the
[capture script](demos.md) and record host/version, OS, event, and result here.
Do not replace a preview disclaimer with a live-recording claim until then.

| Check | Host/version | OS | Event/result | Evidence |
|---|---|---|---|---|
| Claude physical approval cue | Pending | Pending | Pending | Pending |
| Codex trusted physical approval cue | Pending | Pending | Pending | Pending |
| Native pet activity | Pending | Pending | Pending | Pending |
