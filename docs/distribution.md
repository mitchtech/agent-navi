# Distribution maintenance

Close distribution channels: this GitHub repository, its Releases and Pages
site, and compatible official host distribution. npm publication under
`mitchtech` is deferred at the owner's request until npm authentication is ready.
The GitHub package remains usable without a registry publication.

## Release

Keep the versions in `package.json`, `plugin.json`, and
`.claude-plugin/plugin.json` consistent. The pet's `spriteVersionNumber: 2`
describes the atlas format and does not follow the package version.

```bash
npm run check
npm test
python3 -m pip install -r requirements-dev.txt
python3 scripts/check-pet.py
python3 scripts/package-pet.py --with-package
```

The pet packager fixes ZIP entry order, timestamps, and file permissions, then
checks each extracted file against the source. Publish the package tarball,
pet ZIP, and a `SHA256SUMS` containing both artifacts. Attach release notes
covering independent installation and verified host support.

The canonical sheet's original hashes are recorded in `pets/navi/NOTICE.md` and
enforced by asset validation. Intentional future artwork edits require updating
those records and explaining the change, rather than silently recompressing it.

## Pages and previews

`site/` contains dependency-free HTML, CSS, and JavaScript. `npm run site`
builds `dist/site`, copying the canonical pet, audio, and preview assets from
their source directories. Avoid maintaining duplicate sprite or audio files.

`python3 scripts/build-assets.py` regenerates representative GIFs, a transparent
idle frame, and a 1200 x 630 social card. It reads and validates the source pet
before extracting previews. The website uses the canonical sheet directly,
with reduced-motion support and user-initiated sound previews. No analytics,
external fonts, or runtime telemetry are loaded.

The Pages workflow validates and builds before deployment. Review the installed
GitHub Actions versions when updating workflows. The repository homepage points
to `https://mitchtech.github.io/agent-navi/`. Its social card is also available
at `https://mitchtech.github.io/agent-navi/previews/social.png` for repository
settings or shared links.

When preparing another release, update the website and README's versioned ZIP
and package links together. Check keyboard navigation, narrow viewports,
reduced motion, component choices, clipboard feedback, and all sound previews.

## npm and host directories

Future npm publication should use the `mitchtech` account, verifying availability
and ownership of the unscoped `agent-navi` name first. Do not publish until
authentication and any required account approval are complete. Configure
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) through
GitHub Actions after the initial package ownership setup; do not store a
long-lived publishing token in the project.

OpenAI's public plugin submission currently excludes lifecycle-hook ZIPs, so
this package uses its documented GitHub marketplace installation. A native
pet ZIP is not an account-library share link. Validate a separate web export
and its sharing workflow before adding one. [Submission rules](https://developers.openai.com/plugins/deploy/submission)

Measure project visibility using GitHub traffic and release downloads, plus npm
downloads if publication is later enabled. No social outreach or third-party
curated-list submissions are part of this release.
