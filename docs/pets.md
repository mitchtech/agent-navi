# Navi pet

The sound plugin and native pet are independent. Sounds support Claude Code,
Codex, and a generic event interface. The pet is a local v2 Codex bundle whose
animations are controlled by the host, without additional hooks or a daemon.

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
npm install -g github:mitchtech/agent-navi#v0.3.0
agent-navi pet install
agent-navi doctor --pet
```

The CLI requires Node.js 22+. It copies the four bundle files and a local
ownership record. It leaves avatar selection, agent settings, hooks, and audio
configuration unchanged. An identical install is a no-op, including the original
two-file local bundle. Such an existing bundle remains unmanaged.

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
| Other agents | No native integration provided here | Check the host's own pet format |
| ChatGPT web | Separate account upload and compatibility rules | Not installed by this local bundle |

Terminal pets require iTerm2 3.6+, Kitty graphics, or Sixel support and are not
available inside tmux or Zellij. `/pets off` hides a terminal pet. Desktop pets
respect the operating system's reduced-motion setting. Local custom pets do not
automatically sync to the web. The web-upload documentation specifies a shorter
1536 x 1872 atlas; this original v2 sheet is 1536 x 2288. Do not upload it assuming
identical support. [Official pet documentation](https://learn.chatgpt.com/docs/pets)

Desktop host names and availability can change. Refresh the installed host's
pet picker rather than editing a selected avatar ID in its configuration.
The host drives activity states, and the sound plugin drives its own event cues.
Enabling both does not guarantee every visual state has a matching sound.

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

The original sprite sheet and manifest are preserved byte-for-byte. See
[artwork provenance and licensing](../pets/navi/NOTICE.md).

## Validation limits

Structural checks cover all 74 occupied cells, the 14 transparent cells, and
the original file hashes. Visual inspection includes every animation and look
direction. The original directional look frames are smaller than the main
animations, and moving-left row 2, column 5 contains a small isolated edge
fragment. Those existing artwork quirks are preserved in this release.

The website previews and filesystem installer were exercised locally. Native
desktop and terminal rendering were not independently verified during this
update because native UI automation was unavailable. Host support documentation
and the installed local v2 contract establish the bundle format, rather than
an end-to-end test on every surface.
