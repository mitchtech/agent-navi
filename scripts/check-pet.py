"""Validate the canonical Navi v2 bundle. Requires requirements-dev.txt."""

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PET = ROOT / "pets" / "navi"
STATES = [
    ("idle", 6), ("moving-right", 8), ("moving-left", 8), ("waving", 4),
    ("jumping", 5), ("failure", 8), ("waiting", 6), ("working", 6),
    ("review", 6), ("look-up-to-down-right", 8), ("look-down-to-up-left", 8),
]
ORIGINAL_HASHES = {
    "pet.json": "816254a8e1cabc61bdb66d2010c084677f31a552e91cac8c1e33ff2f615e25b2",
    "spritesheet.webp": "f9c0956aa4bebda7dd1b3cff698a91b9d0775703f3f92b8d77f78a8a9fef8722",
}


def validate():
    manifest = json.loads((PET / "pet.json").read_text())
    if (manifest.get("id"), manifest.get("spriteVersionNumber"), manifest.get("spritesheetPath")) != ("navi", 2, "spritesheet.webp"):
        raise ValueError("Expected the canonical navi v2 manifest")
    for key in ["displayName", "description"]:
        if not isinstance(manifest.get(key), str) or not manifest[key].strip():
            raise ValueError(f"Missing {key}")
    for name, expected in ORIGINAL_HASHES.items():
        if hashlib.sha256((PET / name).read_bytes()).hexdigest() != expected:
            raise ValueError(f"Canonical source bytes changed: {name}")
    with Image.open(PET / manifest["spritesheetPath"]) as source:
        if source.format != "WEBP" or source.mode != "RGBA" or source.size != (1536, 2288):
            raise ValueError("Expected a transparent 1536 x 2288 RGBA WebP")
        image = source.copy()
    occupied = 0
    empty = 0
    for row, (state, count) in enumerate(STATES):
        for column in range(8):
            cell = image.crop((column * 192, row * 208, (column + 1) * 192, (row + 1) * 208))
            alpha = cell.getchannel("A")
            visible = sum(alpha.histogram()[1:])
            required = column < count or (row, column) == (0, 6)
            if required:
                if not 50 <= visible < 192 * 208 * 0.95:
                    raise ValueError(f"Empty or opaque {state} frame {column}")
                occupied += 1
            else:
                if visible:
                    raise ValueError(f"Unused cell {row},{column} is not transparent")
                empty += 1
    data = image.tobytes()
    if any(data[i + 3] == 0 and any(data[i:i + 3]) for i in range(0, len(data), 4)):
        raise ValueError("Transparent pixels contain RGB residue")
    return {"format": "v2", "width": image.width, "height": image.height,
            "occupiedCells": occupied, "transparentCells": empty, "originalBytesPreserved": True}


if __name__ == "__main__":
    print(json.dumps(validate(), indent=2))
