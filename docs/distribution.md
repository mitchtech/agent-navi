# Distribution maintenance

Close distribution channels: this GitHub repository, its Releases and Pages
site, and compatible official host distribution. npm publication under
`mitchtech` is deferred at the owner's request until npm authentication is ready.
The GitHub package remains usable without a registry publication.

## Release

`package.json` is the version authority. `npm run check` verifies that the
portable, Claude, and Gemini manifests match it, and that a release tag matches
`v` plus that version. Pet `spriteVersionNumber: 2` describes the atlas format.

Prepare a release on a feature branch, update all manifest versions and the
changelog, and run the contributor checks. After its PR merges into `main`, tag
the merged commit and push the tag:

```bash
git tag v0.4.0
git push origin v0.4.0
```

The release workflow checks Node 22/24 on macOS, Linux, and Windows, including
actual offline tarball installation and Gemini hook execution. Publishing also
requires the tagged commit to be contained in `main`. It validates the atlas,
regenerates previews and checks for drift, then creates the GitHub release.
The workflow publishes no npm registry package.

Local release build:

```bash
npm run check
npm test
npm run test:package
python3 -m pip install -r requirements-dev.txt
python3 scripts/check-pet.py
python3 scripts/build-assets.py
python3 scripts/package-release.py
```

Release assets include the versioned npm tarball and pet ZIP, stable
`agent-navi.tgz` and `agent-navi-pet.zip` aliases, three identically encoded
platform-prefixed Gemini ZIPs, and the validated web export when available.
`SHA256SUMS` covers every attached artifact. ZIP order, timestamps, permissions,
and extracted source bytes are checked.

The Gemini archives contain the manifest at their root and their own default
hook file. Platform prefixes make selection unambiguous among the other assets.
See [Gemini integration](gemini.md). Never publish an archive with missing shared
runtime files or add a default hook file to the source package.

Original pet bytes are archived under `assets/original/navi`; the active bundle
and any web derivative have separate revision records. Intentional repairs
must preserve the archive and explain their method in the artwork notice.

## Pages and previews

`site/` contains dependency-free HTML, CSS, and JavaScript. `npm run site`
builds `dist/site`, copying the canonical pet, audio, and preview assets from
their source directories. Avoid maintaining duplicate sprite or audio files.

`python3 scripts/build-assets.py` regenerates representative GIFs, a transparent
idle frame, and a 1200 x 630 social card. It reads and validates the source pet
before extracting previews. The website uses the canonical sheet directly,
with reduced-motion support and user-initiated sound previews. No analytics,
external fonts, or runtime telemetry are loaded.

The Pages workflow checks out the latest published release tag, validates, and
builds before deployment. It runs after successful releases, on main updates,
or manually; unreleased main changes do not advertise unavailable downloads. Review the installed
GitHub Actions versions when updating workflows. The repository homepage points
to `https://mitchtech.github.io/agent-navi/`. Its social card is also available
at `https://mitchtech.github.io/agent-navi/previews/social.png` for repository
settings or shared links.

The site builder derives version links from package metadata. README pet
downloads use the stable latest-release asset name. Check keyboard navigation, narrow viewports,
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

## Discovery

The repository homepage, concise About description, CI/release/license badges,
and Pages previews form the primary discovery surface. Set the generated
`assets/previews/social.png` as the repository's custom social preview through
GitHub Settings. A Pages Open Graph image is separate from that repository setting.

After the Gemini release is published, add `gemini-cli-extension` and
`gemini-cli` repository topics. The official extension gallery discovers public
repositories with that topic and a root extension manifest; listing depends on
its validation and crawl schedule. No issue, email, or social outreach is needed.
[Official discovery requirements](https://geminicli.com/docs/extensions/releasing/)

Use authenticated GitHub traffic and release-download counts for aggregate
visibility checks. Those counts can include development checks and are not
reliable measurements of unique users. Keep the website free of analytics.
