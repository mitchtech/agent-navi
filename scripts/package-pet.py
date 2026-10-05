"""Build a reproducible pet ZIP and checksum from the canonical source."""

import argparse
import hashlib
import json
import os
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = ["LICENSE.txt", "NOTICE.md", "pet.json", "spritesheet.webp"]


def package(destination, with_package=False):
    version = json.loads((ROOT / "package.json").read_text())["version"]
    destination.mkdir(parents=True, exist_ok=True)
    if with_package:
        subprocess.run(["npm.cmd" if os.name == "nt" else "npm", "pack", "--pack-destination", str(destination.resolve())], cwd=ROOT, check=True)
    archive = destination / f"agent-navi-pet-v{version}.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as output:
        for name in FILES:
            info = zipfile.ZipInfo(f"navi/{name}", date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            output.writestr(info, (ROOT / "pets" / "navi" / name).read_bytes(), compresslevel=9)
    with zipfile.ZipFile(archive) as output:
        if output.namelist() != [f"navi/{name}" for name in FILES]:
            raise ValueError("Unexpected ZIP contents")
        for name in FILES:
            if output.read(f"navi/{name}") != (ROOT / "pets" / "navi" / name).read_bytes():
                raise ValueError(f"ZIP altered {name}")
    tarball = destination / f"agent-navi-{version}.tgz"
    artifacts = sorted([archive, *([tarball] if tarball.exists() else [])])
    (destination / "SHA256SUMS").write_text("".join(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n" for path in artifacts))
    print(archive)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=ROOT / "dist")
    parser.add_argument("--with-package", action="store_true", help="Also build the npm tarball and checksum both artifacts")
    args = parser.parse_args()
    package(args.out, args.with_package)
