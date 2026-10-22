# Media and live capture scripts

## Available previews

These assets are illustrated previews assembled from the existing GIFs, fonts,
and WAV files. They do not show a native host, a real approval dialog, or physical
speaker playback. Keep their labels visible and describe them as previews.

| Asset | Duration | Use |
|---|---|---|
| [Sound preview](../../assets/promotion/sound-preview.mp4) | 24 seconds | Main sound posts; Hey at 4 seconds, Watch out at 10 seconds |
| [Attention preview](../../assets/promotion/attention-preview.mp4) | 12 seconds | Configuration post; silent |
| [Pet preview](../../assets/promotion/pet-preview.mp4) | 12 seconds | Separate pet post; silent atlas preview |

Each MP4 is 1080 x 1080, 15 fps, H.264/yuv420p, with burned-in captions and a
fast-start header. The sound preview includes AAC audio. Matching `.srt` files
and PNG posters live beside the videos. The [manifest](../../assets/promotion/manifest.json)
records hashes, source files, tool versions, and limitations. Existing
[animated GIFs](../../assets/previews/idle.gif) remain available.

Build locally with existing Pillow and FFmpeg installations:

```bash
python3 docs/promotion/build-media.py
```

This script never installs tools, plays audio through speakers, changes original
artwork, uses account credentials, or publishes files. The original atlas remains
untouched. Code is MIT; contributor artwork rights are CC BY 4.0. Video
composition does not grant rights to the Nintendo-derived audio. Preserve the
[audio notice](../../audio/NOTICE.md), [artwork notice](../../pets/navi/NOTICE.md),
and [font notice](../../site/fonts/OFL.md).

## Native approval recording - 20-30 seconds

Use this script when a verified host recording is available. Capture a fresh
disposable project and only the relevant host window. Keep your normal permission
settings. Capture application/system audio if supported; a screen recording
without an audio track does not establish an audible cue.

| Time | Capture | Caption |
|---|---|---|
| 0-3 s | Host and exact version visible; harmless task underway | Your agent is waiting for approval |
| 3-8 s | A real approval request and corresponding Navi cue | Approval needs your attention |
| 8-15 s | Your response to the dialog; retain enough context to understand it | You make the decision |
| 15-22 s | Verified install commands for that host | Agent Navi - local sound cues |
| 22-27 s | Repository address | github.com/mitchtech/agent-navi |

Use a request to write a temporary text file in the disposable project if it
requires approval under the existing policy. If it is already approved, do not
manufacture an approval dialog or substitute a `play` invocation while claiming
native behavior. Keep using the labeled preview until a genuine example is
available. Match the caption to the actual cue: shell/file-change requests may
use Watch out rather than Hey.

Pass criteria: visible native dialog, matching audio track, exact host/version
noted in the capture record, readable captions at phone width, no private content,
and no dubbed cue presented as live playback. Replace the preview disclaimer
in the relevant post only after these criteria pass.

## Quiet configuration recording - 10-15 seconds

Show the current status; invoke `preset attention` through the bundled skill or
repository CLI; show the resulting enabled events. Caption session/prompt cues
as disabled and attention events as host-dependent. Do not claim a silent event
was observed merely because no audio was captured.

## Native pet recording - 10-15 seconds

Record a compatible Codex host with Navi already selected by the owner. Show
idle and at least one actual host-driven activity state. Name that host. Capture
does not authorize changing its current pet selection. If Navi is not selected,
use the labeled atlas preview. Never label a web sprite preview as native Codex.
