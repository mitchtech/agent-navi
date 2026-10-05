# Contributing

Create a feature branch and submit a PR to `main`. Describe the resulting user
behavior, the checks run, and any host limitations. Preserve unrelated work.

## Checks

```bash
npm run check
npm test
npm run test:package
python3 -m pip install -r requirements-dev.txt
python3 scripts/check-pet.py
python3 scripts/build-assets.py
python3 scripts/package-release.py
npm run site
```

Runtime tests inject players and use isolated configuration/pet directories.
Package checks install the real tarball offline and execute the Gemini bundle's
registered hooks, including paths with spaces and shell metacharacters. They do
not prove speaker playback or native pet rendering on every host.

## Layout

`scripts/navi.mjs` owns sound behavior; `scripts/pet.mjs` owns independent local
pet installation. Host manifests and `hooks/{claude,codex,gemini}.json` adapt
those components. `skills/` contains the portable control workflow. The Gemini
builder creates a self-contained extension in `dist/gemini` without adding a
root default hook file to Claude/Codex installations.

`pets/navi` is the current pet; `assets/original/navi` preserves the original
manifest and atlas. `assets/previews` is generated from the current atlas. Keep
preview generation reproducible and record asset revisions in the pet notice.

Release and discovery procedures live in [distribution maintenance](docs/distribution.md).
