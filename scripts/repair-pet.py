"""Reproduce the approved surgical repair from the immutable original atlas."""

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ORIGINAL = ROOT / "assets" / "original" / "navi"
PET = ROOT / "pets" / "navi"
EXPORT = ROOT / "assets" / "exports" / "agent-navi-pet-web.webp"
FRAGMENT = (939, 496, 950, 521)
SCALE = 1.5


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def repair():
    if sha(ORIGINAL / "spritesheet.webp") != "f9c0956aa4bebda7dd1b3cff698a91b9d0775703f3f92b8d77f78a8a9fef8722":
        raise ValueError("Original atlas hash changed; refusing to repair from altered source")
    if sha(PET / "pet.json") != sha(ORIGINAL / "pet.json"):
        raise ValueError("Active manifest differs from the original; inspect it before repair")
    source = Image.open(ORIGINAL / "spritesheet.webp").convert("RGBA")
    if source.size != (1536, 2288):
        raise ValueError("Unexpected original atlas dimensions")
    repaired = source.copy()
    repaired.paste((0, 0, 0, 0), FRAGMENT)
    for row in [9, 10]:
        for column in range(8):
            box = (column * 192, row * 208, (column + 1) * 192, (row + 1) * 208)
            cell = source.crop(box)
            bounds = cell.getchannel("A").getbbox()
            sprite = cell.crop(bounds)
            size = tuple(round(value * SCALE) for value in sprite.size)
            if size[0] > 184 or size[1] > 200:
                raise ValueError(f"Scaled direction {row},{column} would cross the cell margin")
            sprite = sprite.resize(size, Image.Resampling.LANCZOS)
            replacement = Image.new("RGBA", (192, 208))
            replacement.paste(sprite, ((192 - size[0]) // 2, (208 - size[1]) // 2))
            repaired.paste(replacement, (column * 192, row * 208))
    # Resize interpolation can leave color in zero-alpha pixels. Clear only that residue.
    pixels = repaired.load()
    for y in range(repaired.height):
        for x in range(repaired.width):
            if pixels[x, y][3] == 0:
                pixels[x, y] = (0, 0, 0, 0)
    repaired.save(PET / "spritesheet.webp", lossless=True, exact=True, method=6)
    web = repaired.crop((0, 0, 1536, 1872))
    # The nine-row web format has no optional neutral-look cell.
    web.paste((0, 0, 0, 0), (6 * 192, 0, 7 * 192, 208))
    EXPORT.parent.mkdir(parents=True, exist_ok=True)
    web.save(EXPORT, lossless=True, exact=True, method=6)
    revision = {
        "method": "Pillow lossless repair: remove isolated fragment; scale sixteen directional frames 1.5x within their cells",
        "fragmentRectangle": list(FRAGMENT), "directionScale": SCALE,
        "active": {name: sha(PET / name) for name in ["pet.json", "spritesheet.webp"]},
        "web": {"file": EXPORT.relative_to(ROOT).as_posix(), "sha256": sha(EXPORT)},
    }
    (ROOT / "assets" / "pet-revision.json").write_text(json.dumps(revision, indent=2) + "\n")
    print(json.dumps(revision, indent=2))


if __name__ == "__main__":
    repair()
