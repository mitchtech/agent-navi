# Navi pet artwork

This is the existing local Navi pet supplied by Michael J. Mitchell
([mitchtech](https://github.com/mitchtech)), inspired by Navi from Nintendo's
*The Legend of Zelda*. It is a faceless blue-white fairy sphere with four
translucent wings. No Nintendo affiliation or endorsement is implied.

The original files are preserved byte-for-byte in `assets/original/navi` in the
repository. The active bundle includes the documented repairs below. Original
artwork creation tools and generation methods have not been independently
documented. The sprites are not claimed to be extracted
from the game. Original game audio has a separate
[rights notice](https://github.com/mitchtech/agent-navi/blob/main/audio/NOTICE.md).

The contributor's rights in this sprite artwork are licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), as described in
[LICENSE.txt](LICENSE.txt). Suggested credit: "Navi pet artwork by Michael J.
Mitchell / mitchtech, CC BY 4.0, https://github.com/mitchtech/agent-navi."
Credit and license links belong in documentation, rather than over the pet.

## Format

- ID: `navi`; display name: `Navi`.
- `spriteVersionNumber`: `2`.
- WebP, RGBA, 1536 x 2288 pixels; 8 columns and 11 rows.
- Cells: 192 x 208 pixels.
- Standard animations: idle, moving right, moving left, waving, jumping,
  failure, waiting, working, and review.
- Last two rows: 16 clockwise look directions, beginning at up.
- Includes the optional neutral look at row 0, column 6.

## Original SHA-256

| File | SHA-256 |
|---|---|
| pet.json | `816254a8e1cabc61bdb66d2010c084677f31a552e91cac8c1e33ff2f615e25b2` |
| spritesheet.webp | `f9c0956aa4bebda7dd1b3cff698a91b9d0775703f3f92b8d77f78a8a9fef8722` |

## Active revision

The v0.4.0 repair removes only the isolated fragment at pixel rectangle
`[939, 496, 950, 521]` (right and bottom exclusive) in moving-left row 2,
column 4, using zero-based indexes.
The 16 directional frames are enlarged 1.5x and centered within their original
cells with at least a four-pixel margin. Their poses and direction order remain
unchanged. All other decoded animation and neutral-look pixels are preserved.

`scripts/repair-pet.py` reproduces the repair from the archived original using
Pillow's LANCZOS resampling and exact lossless WebP encoding. It clears RGB only
where alpha is zero. `scripts/check-pet.py` verifies the original hashes,
unaffected pixels, fragment removal, cell margins, and derivative contents.

| Active file | SHA-256 |
|---|---|
| pet.json | `816254a8e1cabc61bdb66d2010c084677f31a552e91cac8c1e33ff2f615e25b2` |
| spritesheet.webp | `2ff8ada4209c4160d939e50b5ad723f2db8c25ae8c2a4e3fee57456ede344241` |

## Web derivative

`assets/exports/agent-navi-pet-web.webp` is a transparent 1536 x 1872, nine-row
atlas derived from the repaired bundle. It preserves the nine standard
animations, omits the two directional rows, and clears the optional neutral-look
cell because that cell is unused in the web format. It is a separate account
upload, not a local v2 bundle or automatic synchronization.

SHA-256: `1521788a54945bd269eae5e71f63dcac6ec5f81cf6bc349f1ac42a52b9cabed5`.
The same CC BY 4.0 artwork license and attribution apply to the derivative.
