"""Validate the canonical Navi v2 bundle. Requires requirements-dev.txt."""

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PET = ROOT / "pets" / "navi"
ORIGINAL = ROOT / "assets" / "original" / "navi"
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
        if hashlib.sha256((ORIGINAL / name).read_bytes()).hexdigest() != expected:
            raise ValueError(f"Archived original bytes changed: {name}")
    revision = json.loads((ROOT / "assets" / "pet-revision.json").read_text())
    for name in ORIGINAL_HASHES:
        if hashlib.sha256((PET / name).read_bytes()).hexdigest() != revision["active"][name]:
            raise ValueError(f"Active pet does not match its recorded revision: {name}")
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
    if revision.get("directionScale"):
        with Image.open(ORIGINAL / "spritesheet.webp") as original:
            # Every unaffected cell must retain exact decoded pixels.
            for row in range(9):
                for column in range(8):
                    if (row, column) == (2, 4):
                        continue
                    box = (column * 192, row * 208, (column + 1) * 192, (row + 1) * 208)
                    if image.crop(box).tobytes() != original.crop(box).tobytes():
                        raise ValueError(f"Unexpected pixel changes at {row},{column}")
            x1, y1, x2, y2 = revision["fragmentRectangle"]
            for box in [(768, 416, x1, 624), (x2, 416, 960, 624), (x1, 416, x2, y1), (x1, y2, x2, 624)]:
                if image.crop(box).tobytes() != original.crop(box).tobytes():
                    raise ValueError("Moving-left pixels changed outside the isolated fragment")
            box = (x1, y1, x2, y2)
            if image.crop(box).getchannel("A").getbbox():
                raise ValueError("Isolated fragment remains visible")
            for row in [9, 10]:
                for column in range(8):
                    box = (column * 192, row * 208, (column + 1) * 192, (row + 1) * 208)
                    bounds = image.crop(box).getchannel("A").getbbox()
                    if not (bounds[0] >= 4 and bounds[1] >= 4 and bounds[2] <= 188 and bounds[3] <= 204):
                        raise ValueError(f"Direction frame crosses its cell margin: {row},{column}")
        web_path = ROOT / revision["web"]["file"]
        if hashlib.sha256(web_path.read_bytes()).hexdigest() != revision["web"]["sha256"]:
            raise ValueError("Web export checksum mismatch")
        with Image.open(web_path) as web:
            if web.format != "WEBP" or web.mode != "RGBA" or web.size != (1536, 1872) or web_path.stat().st_size > 20 * 1024 * 1024:
                raise ValueError("Web export violates the upload format")
            for row, (_, count) in enumerate(STATES[:9]):
                for column in range(8):
                    box = (column * 192, row * 208, (column + 1) * 192, (row + 1) * 208)
                    visible = web.crop(box).getchannel("A").getbbox()
                    if bool(visible) != (column < count):
                        raise ValueError(f"Web export cell occupancy mismatch: {row},{column}")
                    if column < count and web.crop(box).tobytes() != image.crop(box).tobytes():
                        raise ValueError(f"Web export changed animation pixels: {row},{column}")
    return {"format": "v2", "width": image.width, "height": image.height,
            "occupiedCells": occupied, "transparentCells": empty, "originalBytesPreserved": True,
            "revision": revision["method"], "webExportValidated": bool(revision.get("web"))}


if __name__ == "__main__":
    print(json.dumps(validate(), indent=2))
