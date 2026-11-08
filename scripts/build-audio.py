"""Rebuild the derived clips from audio/sources.json, or verify every bundled clip with --check. Standard library only."""

import argparse
import hashlib
import io
import json
import re
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"
MANIFEST = AUDIO / "sources.json"
digest = lambda data: hashlib.sha256(data).hexdigest()


def runtime_clips():
    source = (ROOT / "scripts" / "navi.mjs").read_text(encoding="utf-8")
    return re.findall(r"'([a-z0-9-]+)'", re.search(r"const CLIPS = \[(.*?)\];", source, re.S).group(1))


def frames(path, spec):
    with wave.open(str(path), "rb") as clip:
        if (clip.getframerate(), clip.getnchannels(), clip.getsampwidth(), clip.getcomptype()) != (spec["sampleRate"], spec["channels"], spec["sampleWidth"], "NONE"):
            raise ValueError(f"{path.name} is not {spec['sampleRate']} Hz, {spec['channels']}-channel, {8 * spec['sampleWidth']}-bit PCM")
        return clip.readframes(clip.getnframes())


# Derived clips join unmodified source samples with silence; no resampling, gain, or fades.
def render(clip, spec):
    gap = b"\0" * (spec["sampleWidth"] * spec["channels"] * round(spec["sampleRate"] * clip["gapMs"] / 1000))
    data = gap.join(frames(AUDIO / f"{name}.wav", spec) for name in clip["derivedFrom"])
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as out:
        out.setnchannels(spec["channels"])
        out.setsampwidth(spec["sampleWidth"])
        out.setframerate(spec["sampleRate"])
        out.writeframes(data)
    return buffer.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify the committed clips without writing")
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    spec, clips = manifest["format"], manifest["clips"]
    ids = [clip["id"] for clip in clips]
    if ids != runtime_clips():
        raise ValueError("audio/sources.json and the runtime CLIPS list disagree")
    on_disk = sorted(path.stem for path in AUDIO.glob("*.wav"))
    if on_disk != sorted(ids):
        raise ValueError(f"Unlisted or missing WAV files: {sorted(set(on_disk) ^ set(ids))}")
    for clip in clips:
        path = AUDIO / f"{clip['id']}.wav"
        if "derivedFrom" in clip:
            data = render(clip, spec)
            if args.check:
                if data != path.read_bytes():
                    raise ValueError(f"{path.name} is stale; run python3 scripts/build-audio.py")
            else:
                path.write_bytes(data)
        frames(path, spec)
        if digest(path.read_bytes()) != clip["output"]:
            raise ValueError(f"{path.name} does not match its recorded hash")
    print(f"{'Verified' if args.check else 'Built'} {len(clips)} clips")


if __name__ == "__main__":
    main()
