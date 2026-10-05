"""Derive preview artifacts from the canonical atlas; never change source art."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from importlib.util import module_from_spec, spec_from_file_location

ROOT = Path(__file__).resolve().parent.parent
spec = spec_from_file_location("check_pet", ROOT / "scripts" / "check-pet.py")
checker = module_from_spec(spec)
spec.loader.exec_module(checker)
checker.validate()
OUT = ROOT / "assets" / "previews"
OUT.mkdir(parents=True, exist_ok=True)
SHEET = Image.open(ROOT / "pets" / "navi" / "spritesheet.webp").convert("RGBA")
BACKGROUND = (10, 25, 24)


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

# Use a stable bundled Pillow font so assets reproduce on each operating system.
card = Image.new("RGBA", (1200, 630), BACKGROUND + (255,))
draw = ImageDraw.Draw(card)
draw.rounded_rectangle((48, 48, 1152, 582), radius=30, outline=(69, 100, 86), width=2)
draw.text((95, 125), "AGENT NAVI", font=ImageFont.load_default(size=32), fill=(132, 218, 194))
draw.text((90, 205), "Hey! Listen!", font=ImageFont.load_default(size=84), fill=(242, 239, 222))
draw.text((95, 345), "A little fairy. A clearer signal.", font=ImageFont.load_default(size=30), fill=(188, 202, 191))
draw.text((95, 475), "Independent sounds + a Codex pet", font=ImageFont.load_default(size=24), fill=(132, 218, 194))
sprite = frame(0, 0).resize((384, 416), Image.Resampling.LANCZOS)
card.alpha_composite(sprite, (770, 100))
card.convert("RGB").save(OUT / "social.png")
print(f"Built preview assets in {OUT}")
