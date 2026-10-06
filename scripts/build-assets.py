"""Derive preview artifacts from the canonical atlas; never change source art."""

import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageSequence

from importlib.util import module_from_spec, spec_from_file_location

ROOT = Path(__file__).resolve().parent.parent
spec = spec_from_file_location("check_pet", ROOT / "scripts" / "check-pet.py")
checker = module_from_spec(spec)
spec.loader.exec_module(checker)
checker.validate()
PREVIEWS = ROOT / "assets" / "previews"
# --check renders elsewhere and compares pixels: PNG bytes vary with each platform's zlib.
CHECK = "--check" in sys.argv[1:]
OUT = Path(tempfile.mkdtemp()) if CHECK else PREVIEWS
OUT.mkdir(parents=True, exist_ok=True)
SHEET = Image.open(ROOT / "pets" / "navi" / "spritesheet.webp").convert("RGBA")
BACKGROUND = (11, 21, 18)
FONTS = ROOT / "site" / "fonts"
PARCHMENT = (239, 230, 207)
LICHEN = (169, 184, 166)
NAVI = (143, 216, 255)
GOLD = (217, 180, 90)


def frame(row, column):
    return SHEET.crop((column * 192, row * 208, (column + 1) * 192, (row + 1) * 208))


for name, row, count in [("idle", 0, 6), ("working", 7, 6), ("waiting", 6, 6), ("review", 8, 6), ("failure", 5, 8)]:
    frames = []
    for column in range(count):
        canvas = Image.new("RGBA", (288, 288), BACKGROUND + (255,))
        canvas.alpha_composite(frame(row, column), (48, 40))
        frames.append(canvas.convert("RGB"))
    frames[0].save(OUT / f"{name}.gif", save_all=True, append_images=frames[1:], duration=160, loop=0, disposal=2)
frame(0, 0).save(OUT / "idle.png")


def font(name, size, weight=None):
    loaded = ImageFont.truetype(str(FONTS / name), size, layout_engine=ImageFont.Layout.BASIC)
    if weight:
        loaded.set_variation_by_axes([weight])
    return loaded


def tracked(draw, xy, text, typeface, fill, spacing):
    x, y = xy
    for character in text:
        draw.text((x, y), character, font=typeface, fill=fill)
        x += draw.textlength(character, font=typeface) + spacing
    return x


def glow(canvas, center, radius, color, strength):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    cx, cy = center
    ImageDraw.Draw(layer).ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=color + (strength,))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(radius / 2.2)))


def diamond(draw, center, size, outline, fill=None):
    x, y = center
    draw.polygon([(x, y - size), (x + size, y), (x, y + size), (x - size, y)], outline=outline, fill=fill)


def flourish(draw, y, left, right, color):
    middle = (left + right) // 2
    for x in range(left, right):
        distance = abs(x - middle) / ((right - left) / 2)
        alpha = int(150 * max(0.0, 1 - distance) ** 0.6)
        if abs(x - middle) > 16:
            draw.point((x, y), fill=color + (alpha,))
    diamond(draw, (middle, y), 6, color + (255,))


def framed(width, height):
    canvas = Image.new("RGBA", (width, height), BACKGROUND + (255,))
    draw = ImageDraw.Draw(canvas, "RGBA")
    inset = 28
    draw.rectangle((inset, inset, width - inset, height - inset), outline=GOLD + (60,), width=1)
    for x, y, dx, dy in [(inset, inset, 1, 1), (width - inset, inset, -1, 1), (inset, height - inset, 1, -1), (width - inset, height - inset, -1, -1)]:
        draw.line((x, y, x + 26 * dx, y), fill=GOLD + (255,), width=2)
        draw.line((x, y, x, y + 26 * dy), fill=GOLD + (255,), width=2)
    return canvas


def fairy(canvas, center, scale):
    cx, cy = center
    glow(canvas, (cx, cy + int(10 * scale)), int(180 * scale), NAVI, 70)
    sprite = frame(0, 0).resize((int(192 * scale), int(208 * scale)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(sprite, (cx - sprite.width // 2, cy - sprite.height // 2))


def headline(canvas, xy, size):
    draw = ImageDraw.Draw(canvas, "RGBA")
    x, y = xy
    roman = font("cormorant-garamond-latin-wght-normal.woff2", size, 500)
    italic = font("cormorant-garamond-latin-wght-italic.woff2", size, 500)
    draw.text((x, y), "Hey!", font=roman, fill=PARCHMENT)
    offset = x + draw.textlength("Hey! ", font=roman)
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((offset, y), "Listen!", font=italic, fill=NAVI + (150,))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(14)))
    draw.text((offset, y), "Listen!", font=italic, fill=NAVI)


# Fonts are the site's self-hosted OFL faces, so the cards match the page on every OS.
card = framed(1200, 630)
draw = ImageDraw.Draw(card, "RGBA")
diamond(draw, (100, 140), 5, GOLD + (255,))
tracked(draw, (118, 126), "AGENT NAVI", font("cinzel-latin-wght-normal.woff2", 26, 600), GOLD, 6)
headline(card, (92, 178), 118)
draw.text((96, 340), "A little fairy. A clearer signal.", font=font("cormorant-garamond-latin-wght-italic.woff2", 40, 500), fill=PARCHMENT)
flourish(draw, 438, 96, 640, GOLD)
draw.text((96, 470), "Sounds for Claude Code, Codex, and Gemini CLI", font=font("alegreya-sans-latin-500-normal.woff2", 28), fill=LICHEN)
draw.text((96, 508), "A native Codex pet", font=font("alegreya-sans-latin-500-normal.woff2", 28), fill=LICHEN)
fairy(card, (930, 300), 2.0)
card.convert("RGB").save(OUT / "social.png")

banner = framed(1280, 440)
draw = ImageDraw.Draw(banner, "RGBA")
diamond(draw, (104, 120), 5, GOLD + (255,))
tracked(draw, (122, 106), "AGENT NAVI", font("cinzel-latin-wght-normal.woff2", 24, 600), GOLD, 6)
headline(banner, (96, 150), 128)
draw.text((100, 318), "Sound cues for coding agents and a native Codex pet.", font=font("alegreya-sans-latin-500-normal.woff2", 30), fill=LICHEN)
fairy(banner, (1020, 220), 1.75)
banner.convert("RGB").save(OUT / "banner.png")

touch = Image.new("RGBA", (180, 180), BACKGROUND + (255,))
glow(touch, (90, 96), 70, NAVI, 80)
icon = frame(0, 0).resize((158, 171), Image.Resampling.LANCZOS)
touch.alpha_composite(icon, (11, 2))
touch.convert("RGB").save(OUT / "touch-icon.png")


def frames_of(path):
    with Image.open(path) as image:
        return [(item.convert("RGBA"), item.info.get("duration")) for item in ImageSequence.Iterator(image)]


if CHECK:
    stale = []
    for built in sorted(OUT.iterdir()):
        committed = PREVIEWS / built.name
        if not committed.exists():
            stale.append(built.name)
            continue
        expected, actual = frames_of(committed), frames_of(built)
        if len(expected) != len(actual) or any(a[1] != b[1] or ImageChops.difference(a[0], b[0]).getbbox(alpha_only=False) for a, b in zip(expected, actual)):
            stale.append(built.name)
    if stale:
        sys.exit(f"Preview assets are stale; run python3 scripts/build-assets.py: {', '.join(stale)}")
    print("Preview assets match the current atlas and fonts")
else:
    print(f"Built preview assets in {OUT}")
