# Navi pet

The sound plugin and native pet are independent. Sounds support Claude Code,
Codex, Gemini CLI, and a generic event interface. The pet is a local v2 Codex
bundle whose animations are controlled by the host, without additional hooks
or a daemon.

## Manual installation

Download the pet ZIP from [Releases](https://github.com/mitchtech/agent-navi/releases).
Extract the `navi` directory under your configured Codex home's `pets` directory:

```text
~/.codex/pets/navi/
  pet.json
  spritesheet.webp
  LICENSE.txt
  NOTICE.md
```

If `CODEX_HOME` is configured, use `<CODEX_HOME>/pets/navi/` instead. On Windows,
the default is the `.codex/pets/navi` directory inside your user home. This path
is independent of the sound configuration and operating-system audio settings.
Do not overwrite a different existing pet without preserving a backup.

No Node.js, Python, audio player, or agent plugin is needed to copy the ZIP.

## CLI installation

```bash
npm install -g github:mitchtech/agent-navi#v0.4.0
agent-navi pet install
agent-navi doctor --pet
```

The CLI requires Node.js 22+. It copies the four bundle files and a local
ownership record. It leaves avatar selection, agent settings, hooks, and audio
configuration unchanged. An identical install is a no-op, including a matching
two-file local bundle. Such an existing bundle remains unmanaged. The repaired
v0.4.0 atlas differs from the original artwork, so an original installation
requires explicit replacement with a backup.

Different files require `agent-navi pet install --replace`. The previous entire
directory is renamed to `navi.backup-<unique-suffix>` next to the new installation.
The command prints its path. Keep or manually move that backup out of `pets`
after reviewing it. The host might display a backup folder as another pet.
Files and symbolic links at the target directory path are never replaced.

## Selection and support

| Surface | Local Navi pet | Selection |
|---|---|---|
| Desktop host with custom pet picker | Compatible v2 bundle | Refresh the pet picker and choose Navi |
| Interactive Codex CLI | Compatible graphics terminal required | `/pets Navi`; `/pets` opens the picker |
| Codex IDE extension | No native picker or overlay | Use the desktop host or CLI |
| Claude Code | No native integration provided here | Sound plugin only |
| Gemini CLI | No native integration provided here | Sound extension only |
| Other agents | No native integration provided here | Check the host's own pet format |
| ChatGPT web | Separate account upload and compatibility rules | Not installed by this local bundle |

Terminal pets require iTerm2 3.6+, Kitty graphics, or Sixel support and are not
available inside tmux or Zellij. `/pets off` hides a terminal pet. Desktop pets
respect the operating system's reduced-motion setting. Local custom pets do not
automatically sync to the web. Use the separate web derivative described below
rather than the local v2 sheet.
[Official pet documentation](https://learn.chatgpt.com/docs/pets)

Desktop host names and availability can change. Refresh the installed host's
pet picker rather than editing a selected avatar ID in its configuration.
The host drives activity states, and the sound plugin drives its own event cues.
Enabling both does not guarantee every visual state has a matching sound.

## Web upload

Download [agent-navi-pet-web.webp](https://github.com/mitchtech/agent-navi/releases/latest/download/agent-navi-pet-web.webp)
from a v0.4.0 or later release. It is a transparent 1536 x 1872 WebP below the
20 MiB upload limit, with nine standard animation rows. Directional rows and the
optional neutral cell are omitted for the web format.

Upload this image through the web pet creation flow and retain the artwork
attribution and [CC BY 4.0 license](../pets/navi/LICENSE.txt) when sharing it.
This upload creates a separate account pet; it does not install or select the
local Codex bundle. Structural compatibility is validated, but an account upload
and host-generated share link have not been verified in this update.

## Diagnostics and removal

```bash
agent-navi pet status
agent-navi pet status --json
agent-navi doctor --pet
agent-navi pet uninstall
```

Status reports `not-installed`, `matching`, `modified`, or `conflict`. Matching
refers to the canonical bundle bytes; it does not prove a host has selected or
rendered the pet. `doctor --pet` exits successfully only for a matching bundle.
An optional missing pet does not fail the full sound-oriented `doctor` command.

Uninstall removes only an unchanged CLI-owned installation, leaving the Codex
home and settings intact. It refuses edited files, unknown additional files,
symbolic links, and unmanaged installations. For a ZIP install, inspect and
manually remove only its `navi` directory. Select a different pet in the host
before removal if Navi is active.

If the pet is missing from the picker, check `CODEX_HOME`, the directory nesting,
and `spriteVersionNumber: 2` in `pet.json`. Refresh the picker or restart the
host. In the CLI, also check terminal graphics support and multiplexer use.

The original sprite sheet and manifest are preserved byte-for-byte in
`assets/original/navi`; the active atlas includes the documented repair. See
[artwork provenance and licensing](../pets/navi/NOTICE.md).

## Validation limits

Structural checks cover all 74 occupied cells, the 14 transparent cells, original
and active hashes, exact unaffected pixels, repaired cell margins, and the web
derivative. Visual inspection includes every animation and look direction. The
active atlas removes the isolated moving-left fragment and enlarges only the
16 directional frames by 1.5x. Their existing poses remain intact.

The website previews and filesystem installer were exercised locally. Native
desktop and terminal rendering were not independently verified during this
update because native UI automation was unavailable. Host support documentation
and the installed local v2 contract establish the bundle format, rather than
an end-to-end test on every surface.
