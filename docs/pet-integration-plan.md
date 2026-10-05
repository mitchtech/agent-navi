# Pet integration design record

The independent pet integration shipped in v0.3.0. This document records the
selected design; current installation and support instructions live in
[pets.md](pets.md) and [compatibility.md](compatibility.md).

- The original local Navi manifest and v2 atlas are the source artwork.
- Sounds and pets install, configure, and uninstall independently.
- Host-native state and animation drive the pet; no synchronization service runs.
- The CLI preserves user selection, conflicting files, and unmanaged installations.
- MIT covers code; CC BY 4.0 covers contributor rights in pet artwork; original
  Nintendo audio has its own rights notice.
- GitHub Releases/Pages and compatible official hosts are the distribution channels.
  npm publication remains deferred at the owner's request.
- Structural validation and installer tests are distinct from verified native rendering.

The approved follow-up preserves original files separately, repairs the current
atlas, expands animation previews, and validates a separate web export. See the
[artwork notice](../pets/navi/NOTICE.md) for revisions and hashes, and
[distribution maintenance](distribution.md) for release procedures.
