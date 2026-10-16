# Public post drafts

Owner review required before publishing. These drafts describe documented
behavior, not fabricated user results. Attach the matching captioned preview
from [demos.md](demos.md). Keep its preview label visible. Substitute a live clip
only after the native capture checklist passes. Recheck community rules and
flair on publication day. Use one primary destination per post.

## R1 - r/ClaudeCode weekly showcase

I built Agent Navi, a free sound-notification plugin for Claude Code. It uses
Navi's familiar voice clips when the agent needs approval, and supports Claude's
input/idle notifications too.

The attached clip is an illustrated sound preview, not a live hook recording.

Install from your terminal:

```bash
claude plugin marketplace add mitchtech/agent-navi
claude plugin install navi@agent-navi
```

It needs Node.js 22+ and local audio. Restart Claude Code after installation.
It runs locally with no runtime telemetry, and the hooks never approve or block
actions. If the session/prompt cues are too much, ask "Navi, use the attention
preset" to keep approval, question, and ready notifications where supported.

Install details: https://github.com/mitchtech/agent-navi#sounds-only

Which cues would you actually keep enabled? I'm particularly interested in
whether approval-only or approval plus idle notifications feels more useful.

## R2 - r/codex showcase

Title: I built Agent Navi: local sound cues for Codex approvals, plus an optional pet

I made Agent Navi, a free plugin that adds Navi's sound cues to local Codex
sessions. Approval requests get an audible cue; shell and file-change approvals
use "Watch out!" when the tool identity is available. That cue identifies the
tool category, not whether a command is dangerous.

The attached video illustrates the sound; it is not a live Codex recording.

```bash
codex plugin marketplace add mitchtech/agent-navi
codex plugin add navi@agent-navi
```

Requirements: Node.js 22+, a local audio player/device, and a restart. Review
and trust the installed commands in Codex's hook settings. Installation alone
does not trust hooks.

There are no npm runtime dependencies or runtime telemetry. Hooks return
promptly and do not supply approval decisions. Completion sounds are off by
default. Codex question/idle notifications do not have native mappings in this
release. SSH/container execution plays where the hook runs, not automatically
on your laptop.

There is also a separate Codex pet ZIP. Installing the plugin does not install
or select a pet, and installing the pet does not enable sounds.

Install and compatibility details:
https://github.com/mitchtech/agent-navi#sounds-only

Where does setup get confusing: adding the marketplace, hook trust, or local
audio? If something fails, the host version and operating system would help me
reproduce it. Please leave private prompts and credentials out of reports.

## X1 - sound introduction

I built Agent Navi: familiar Navi sound cues for Claude Code and Codex approvals.

Local. No runtime telemetry. Free to try.

Clip: illustrated sound preview.

https://github.com/mitchtech/agent-navi#sounds-only

## X2 - quiet configuration

Want approval cues without the prompt chatter?

Agent Navi's attention preset turns off session/prompt sounds.
Ask your agent: "Navi, use the attention preset."

Event coverage varies by host. Clip: preview.

https://github.com/mitchtech/agent-navi#sound-controls

## X3 - independent pet

I also made a Navi pet for compatible Codex hosts.

The pet installs separately. No Node.js needed for the ZIP, and no sounds are
enabled by installing it. You choose it in your host.

Clip: atlas animation preview.

https://github.com/mitchtech/agent-navi#pet-only

## X4 - useful follow-up

Trying Agent Navi? Add the marketplace, install the plugin, then restart.

Codex also requires hook trust review. Remote sessions play audio on the
machine running the hook.

Setup and troubleshooting:
https://github.com/mitchtech/agent-navi#sounds-only

## L1 - LinkedIn maker introduction

I built Agent Navi, a small sound-notification plugin for Claude Code and Codex.
It uses Navi's familiar voice cues when a coding agent needs attention.

The attached video is an illustrated preview of a cue, rather than a live agent
recording. The project is free to try.

The engineering problem was making a notification useful without making it
part of the agent's control flow. The hooks return promptly, leave approval
decisions alone, and tolerate missing audio or malformed input. The runtime
requires Node.js 22+ and has no npm dependencies or telemetry.

Sounds work independently of the optional Codex pet. That separation matters:
someone should be able to choose a notification without having their current
companion replaced.

Code and installation:
https://github.com/mitchtech/agent-navi#sounds-only

If you use local coding agents, which event deserves a sound: approval, a
question, or the agent becoming ready for your next input?

## L2 - LinkedIn engineering follow-up

A notification plugin has a small job. It still has to handle a surprisingly
large number of ways for a speaker to be unavailable.

For Agent Navi, I kept the runtime dependency-free and shared the sound player
across Claude Code, Codex, and Gemini CLI. Host registrations stay separate
because the agents expose different events.

The hooks launch a detached playback worker and return promptly. Missing audio
does not become a failed coding task. Repeated events have a cooldown, and a
shared playback lock prevents overlapping clips.

One boundary I document explicitly: tests simulate players and host payloads.
They do not establish that every desktop, operating system, and remote audio
setup has been physically tested.

The implementation and its compatibility notes are public:
https://github.com/mitchtech/agent-navi

It's a small project, but the design rule is useful elsewhere: an optional
notification should remain optional when it fails.

## Replies and follow-up

Successful install: "Glad it worked. Which host and OS are you using, and which
cues did you leave on?"

Continued use, after at least a week and only in a willing conversation:
"Have you kept Navi enabled? If you muted or removed it, what led to that?"

Install problem: "Which host/version and OS are you using? Please share the
error with private paths and credentials removed. The diagnostics and hook
trust notes are in the README."

When someone has found it useful: "A GitHub star helps other people find it if
you'd like to support the project." Do not ask for Reddit votes or coordinated
engagement.
