# Navi pet integration and visibility plan

Status: approved design implemented for v0.3.0. The original local pet, independent CLI, documentation, preview assets, packaging, and Pages workflow are included. GitHub Releases and Pages are the publication targets. npm publication is deferred at the owner's request. Native host rendering remains unverified in this session; see docs/pets.md for validation limits.

## Findings and selected direction

The canonical project is [mitchtech/agent-navi](https://github.com/mitchtech/agent-navi), currently released as v0.2.0. This update would add the visual companion alongside its portable sound notifications.

The local bundle at ~/.codex/pets/navi contains pet.json and spritesheet.webp. The ZIP beside it contains identical manifest and sprite bytes. Its manifest identifies navi, display name Navi, and spriteVersionNumber 2. The transparent WebP is 1536 x 2288 pixels, approximately 1.6 MB. It matches the v2 atlas dimensions; full frame and animation validation remains to be done.

Recommendation selected for the plan: use ~/.codex/pets/navi as the canonical source. Its manifest, artwork, and matching ZIP provide a concrete, reproducible bundle. The configured selected-avatar-id is a different identifier, so leave selection unchanged. Preserve the existing artwork and identity unless validation identifies a concrete defect.

Confirmed: sounds and the pet must be fully independent. Offer sounds, pet, and both as independently selectable installation choices. The project remains agent agnostic, while the native pet integration explicitly names the hosts that support it.

At planning time, authenticated GitHub inspection confirmed admin access; Pages and Discussions were disabled, and the homepage pointed to the repository. The implementation targets a Pages homepage and release downloads. npm authentication was absent and publication has since been deferred. An agent-navi lookup returned 404; that did not reserve the name.

## Repository contents and identity

Add these files:

- pets/navi/pet.json and pets/navi/spritesheet.webp: the canonical local pet, copied without recompression.
- pets/navi/NOTICE.md: creator, provenance, approved artwork terms, atlas format, and source information.
- docs/pets.md: installation, selection, removal, compatibility, troubleshooting, and web-sharing limitations.
- assets/previews/: representative animated previews and a static social card, derived from the approved sprite sheet.
- scripts/pet.mjs: the small local installation helper, only if the proposed CLI workflow is accepted.
- A deterministic packaging script and asset validation integrated into the existing CI workflow.

Keep agent-navi as the repository and package identity, navi as the existing plugin identity, and navi as the local pet ID. A platform-managed pet ID is a separate identifier. Do not replace local IDs with account IDs or add an undocumented pets field to plugin manifests.

Update README, package description, plugin descriptions, compatibility documentation, and changelog to describe the sound and visual companion accurately. Keep code licensing, original game audio notices, and the new artwork terms explicit and separate. Recommend CC BY 4.0 for the user-created pet artwork and retain MIT for code. CC BY 4.0 permits redistribution, modifications, and commercial reuse with attribution and change notices. This supports reuse while keeping credit attached to the project. Apply it only to rights the creator controls; it does not relicense the original game audio or third-party material. Record the actual artwork provenance without assuming a generation method. [CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/)

The release version and spriteVersionNumber have different meanings. A proposed v0.3.0 release can still use spriteVersionNumber 2.

## Installation and everyday use

Extend the existing CLI with:

- agent-navi pet install: install the bundled pet into the configured Codex home's pets/navi directory.
- agent-navi pet status: report whether the bundle is installed, its format, and whether local files differ from the release.
- agent-navi pet uninstall: remove only an installation the tool can verify it owns.
- agent-navi doctor: include pet availability and actionable host instructions alongside existing audio diagnostics.

Read CODEX_HOME when present, otherwise use ~/.codex. Do not rewrite that environment variable or global Codex settings. Install by copying files, so the pet works independently of a checkout or plugin cache location.

Make identical reinstallations a no-op. Refuse to overwrite a conflicting or user-modified pet without an explicit replace request. Use a temporary sibling directory and a rename for installation. Test interrupted installation and conflict handling. Do not make selection an installation side effect; explain the native picker and selection commands instead.

README entry points:

1. Sounds only: existing Claude, Codex, and generic-event workflows.
2. Pet only: downloadable ZIP or CLI installation, with no audio setup.
3. Both: install the sounds and pet, then select Navi through the supported host.

Pet state and animation should be driven by the host. The audio hooks continue using the existing normalized events. Do not introduce a polling daemon, modify avatar selection on every prompt, or claim native pet overlays for unsupported agents.

Local desktop pets do not automatically sync to the web. Terminal pets require supported graphics, do not work inside tmux or Zellij, and the IDE extension has no native pet picker or overlay. The web-upload documentation currently requires a 1536 x 1872 atlas, while this local pet uses 1536 x 2288. Treat web export and account sharing as a separate compatibility task, preserving the v2 source. [Official pet documentation](https://learn.chatgpt.com/docs/pets)

## Validation and release artifacts

Validate the canonical atlas before publication:

- Parse the manifest; verify its ID, relative sprite path, and v2 declaration.
- Verify dimensions, transparency, the 73 required animation/direction cells, the existing optional neutral cell, and the remaining 14 transparent cells.
- Inspect every animation and directional look for clipping, alignment, scale changes, and recognizable motion.
- Compare installed, repository, and packaged bytes by SHA-256.
- Exercise the actual pet in a supported desktop host and Codex CLI.
- Confirm muted audio and reduced-motion behavior remain usable.

Generate short previews of idle, working, waiting, review, and failure states. Use these to assess appearance, not as a substitute for validating every required cell. Preserve the original sheet unless a reproducible defect warrants a targeted correction.

Extend CI with manifest consistency, atlas structure, ZIP contents, and meaningful installer tests on macOS, Linux, and Windows. Successful filesystem tests do not establish native UI support on every platform.

Publish a release containing the existing package tarball, agent-navi-pet-v0.3.0.zip with a navi/ root directory, and SHA256SUMS. The extracted ZIP must be ready to place under the user's pets directory. Include screenshots and clear install instructions in the release notes.

## Discoverability using configured access

Recommended public presentation:

- Enable GitHub Pages at the repository's standard Pages address and set it as the homepage.
- Build a small static landing page with an animated pet, user-initiated sound previews, installation choices, compatibility information, and direct release downloads.
- Include a still preview and respect reduced-motion preferences. Do not autoplay sound.
- Add a repository social preview, concise search metadata, and relevant custom-pet topics.
- Use the same hero preview and installation choices in the README.
- Publish a clear GitHub release announcing the visual companion and its supported hosts.
- Add bug and feature request templates that collect host, version, and diagnostics without credentials.

A static site is sufficient. No framework, backend, tracking service, or custom DNS is needed.

Target npm publication of the existing CLI under the mitchtech account, using the unscoped agent-navi package name if available. Verify account authentication and package ownership before publishing. The user has specified the intended account; the local npm session is not currently authenticated. Use GitHub Actions trusted publishing with provenance rather than adding a long-lived publish token. npm supports GitHub Actions OIDC publishing and requires a compatible npm version; ownership setup is still required. [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)

Keep distribution close to the project: GitHub repository and Releases, the project Pages site, npm under mitchtech, and official host distribution surfaces that accept the actual package. The current OpenAI public submission route excludes lifecycle-hook ZIPs, so the sound plugin cannot simply be submitted as-is. Consider a skills-only pet companion only if it provides useful installation guidance and meets the current rules; do not create a server merely to qualify for a listing. [OpenAI submission requirements](https://developers.openai.com/plugins/deploy/submission)

If account sharing is desired, identify the intended platform pet, confirm its artwork and format, and obtain a share link through that platform's supported workflow. Do not assume the local ZIP or the configured avatar ID is an account-library pet.

Scope confirmed: stay within the close distribution channels listed above. Social and community announcements, third-party curated-list contributions, and outreach are excluded. Use configured access to prepare and maintain the project-owned channels.

## Additional utility worth including

Include now:

- A compatibility table that separates sounds from native pets and names actual supported surfaces.
- A single troubleshooting path through doctor, plus manual installation instructions for users without Node.
- Clear uninstall instructions and independent controls for sounds and the pet.
- A preview page that lets users see and hear Navi before installing.
- Reproducible archives and checksums so the repository, download, and installed pet agree.

Consider after the core integration:

- An attention-only audio preset, retaining the existing behavior as the default.
- A tested web-compatible export and platform share link, if requested.
- A short demonstration of working, waiting, and approval behavior.
- GitHub Discussions if support activity warrants another channel.

Measure visibility through repository traffic, release downloads, and npm download totals if published. Avoid runtime telemetry. Current traffic is too small to infer adoption, and installation-related clones may be our own.

## Recorded decisions

1. Canonical pet: recommend the existing local navi bundle, preserving its artwork and v2 format.
2. Artwork license: recommend CC BY 4.0; retain MIT for code and separate third-party audio notices.
3. Installation: sounds and pets are fully independent.
4. Visibility: GitHub, the project Pages site, npm, and compatible official host distribution only.
5. npm ownership: mitchtech.

During implementation, record artwork provenance and verify npm authentication. These are publication checks, not additional product decisions. npm publication is explicitly deferred. Implementation follows the approved direction in this document.

## Completion criteria

The approved artwork is tracked and correctly licensed; the original bytes are preserved unless a documented correction is approved. A release ZIP installs and renders correctly. CLI installation is repeatable and handles conflicts safely. Existing sound behavior and checks continue to pass. Documentation distinguishes native pet support from sound support. The public preview and all download links work. Any chosen publication or sharing workflow has been verified against its current host requirements.
