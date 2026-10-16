"""Build labeled promotional previews from existing assets, not host recordings."""

import hashlib
import json
import shutil
import subprocess
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageSequence

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "promotion"
OUT.mkdir(parents=True, exist_ok=True)
SIZE, FPS = 1080, 15
BG, INK, BLUE, GOLD = "#0b1512", "#efe6cf", "#8fd8ff", "#d9b45a"
FONT = ROOT / "site/fonts/alegreya-sans-latin-500-normal.woff2"
TITLE = ROOT / "site/fonts/cormorant-garamond-latin-wght-normal.woff2"


def text(draw, y, content, size=42, color=INK, title=False):
    font = ImageFont.truetype(str(TITLE if title else FONT), size)
    for line in content.split("\n"):
        width = draw.textlength(line, font=font)
        if width > 940:
            raise ValueError(f"Caption exceeds safe width: {line}")
        draw.text(((SIZE - width) / 2, y), line, font=font, fill=color)
        y += size * 1.25


def card(title, subtitle, footer):
    image = Image.new("RGB", (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(image)
    draw.rectangle((38, 38, 1042, 1042), outline="#4f4932", width=2)
    text(draw, 90, "AGENT NAVI", 30, GOLD)
    text(draw, 158, title, 74, title=True)
    text(draw, 280, subtitle, 38)
    text(draw, 854, "github.com/mitchtech/agent-navi", 34, BLUE)
    text(draw, 934, footer, 26, "#a9b8a6")
    return image


animations = {}
for state in ("idle", "working", "waiting"):
    with Image.open(ROOT / f"assets/previews/{state}.gif") as gif:
        animations[state] = [frame.convert("RGB").resize((360, 360))
                             for frame in ImageSequence.Iterator(gif)]

sound_scenes = [
    (0, 4, "A cue when it counts", "Sounds for Claude Code and Codex", "working"),
    (4, 10, "Approval needed", 'General approval cue: "Hey!"', "waiting"),
    (10, 17, "Shell or edit approval", 'Tool-category cue: "Watch out!"', "waiting"),
    (17, 24, "Bring Navi along", "Local audio. No runtime telemetry.\nOptional Codex pet installs separately.", "idle"),
]
attention_scenes = [
    (0, 5, "Keep the useful cues", "Use the attention preset", "idle"),
    (5, 12, "Less prompt chatter", "Attention events stay enabled\nwhere your host supports them.", "waiting"),
]
pet_scenes = [
    (0, 4, "A companion for Codex", "Independent pet. No sounds enabled.", "idle"),
    (4, 8, "Let your host animate it", "Compatible Codex hosts drive activity.", "working"),
    (8, 12, "Your setup. Your choice.", "Download the ZIP. Choose Navi yourself.", "waiting"),
]


def build(name, scenes, footer, cues=(), configuration=False):
    duration = scenes[-1][1]
    temporary = ROOT / "dist/promotion/render"
    temporary.mkdir(parents=True, exist_ok=True)
    video = temporary / f"{name}.mp4"
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
               "-f", "rawvideo", "-pixel_format", "rgb24", "-video_size", "1080x1080",
               "-framerate", str(FPS), "-i", "pipe:0"]
    command += ["-frames:v", str(duration * FPS), "-c:v", "libx264", "-threads", "2",
                "-preset", "fast", "-crf", "26", "-pix_fmt", "yuv420p",
                "-movflags", "+faststart", str(video)]
    cards = [card(title, subtitle, footer) for _, _, title, subtitle, _ in scenes]
    if configuration:
        for image in cards:
            text(ImageDraw.Draw(image), 750, "agent-navi preset attention", 38, BLUE)
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for tick in range(duration * FPS):
            second = tick / FPS
            index = next(i for i, scene in enumerate(scenes) if scene[0] <= second < scene[1])
            image = cards[index].copy()
            frames = animations[scenes[index][4]]
            image.paste(frames[int(second / 0.16) % len(frames)], (360, 394))
            if name == "sound-preview" and (4 <= second < 5.5 or 10 <= second < 11.5):
                cue = '"Hey!"' if second < 5.5 else '"Watch out!"'
                text(ImageDraw.Draw(image), 765, cue, 48, BLUE)
            process.stdin.write(image.tobytes())
            if tick == FPS:
                image.save(OUT / f"{name}.png")
            if tick % (FPS * 4) == 0:
                print(f"{name}: {tick // FPS}/{duration} seconds rendered", flush=True)
    finally:
        process.stdin.close()
    if process.wait():
        raise RuntimeError(f"ffmpeg failed for {name}")
    if cues:
        track = bytearray(duration * 32000 * 2)
        for offset, clip in cues:
            with wave.open(str(ROOT / f"audio/{clip}.wav")) as source:
                assert (source.getframerate(), source.getnchannels(), source.getsampwidth()) == (32000, 1, 2)
                samples = source.readframes(source.getnframes())
                start = offset * 32000 * 2
                track[start:start + len(samples)] = samples
        audio = temporary / f"{name}.wav"
        with wave.open(str(audio), "wb") as destination:
            destination.setparams((1, 2, 32000, 0, "NONE", "not compressed"))
            destination.writeframes(track)
        command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video),
                    "-i", str(audio), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-shortest", "-t", str(duration),
                    "-movflags", "+faststart", str(OUT / f"{name}.mp4")]
        subprocess.run(command, check=True)
    else:
        shutil.copyfile(video, OUT / f"{name}.mp4")

    def timestamp(second):
        return f"00:{second // 60:02d}:{second % 60:02d},000"

    subtitles = []
    for index, (start, end, title, subtitle, _) in enumerate(scenes, 1):
        subtitles.append(f"{index}\n{timestamp(start)} --> {timestamp(end)}\n"
                         f"{title}\n{subtitle}\n{footer}\n")
    (OUT / f"{name}.srt").write_text("\n".join(subtitles))


build("sound-preview", sound_scenes,
      "Illustrated sound preview - not a live host recording", ((4, "hey"), (10, "watchout")))
build("attention-preview", attention_scenes,
      "Configuration preview - event coverage varies by host", configuration=True)
build("pet-preview", pet_scenes,
      "Atlas animation preview - not a native host recording")

sources = [ROOT / f"assets/previews/{state}.gif" for state in animations]
sources += [ROOT / "audio/hey.wav", ROOT / "audio/watchout.wav", FONT, TITLE]


def record(path):
    return {"path": str(path.relative_to(ROOT)), "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


manifest = {
    "kind": "illustrated-previews", "dimensions": [SIZE, SIZE], "fps": FPS,
    "sources": [record(path) for path in sources],
    "artifacts": [record(path) for path in sorted(OUT.iterdir()) if path.suffix in (".mp4", ".png", ".srt")],
    "tools": {"Pillow": __import__("PIL").__version__, "ffmpeg": subprocess.check_output(
        ["ffmpeg", "-version"], text=True).splitlines()[0]},
    "credentials_used": [],
    "limitations": ["Not a live host or physical audio recording.",
                     "No claim of native pet rendering or hook execution in these videos.",
                     "Audio is assembled from the existing, separately licensed recordings."],
}
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Built three captioned previews in {OUT.relative_to(ROOT)}")
