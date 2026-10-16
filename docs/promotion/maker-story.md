# Why I built Agent Navi

Coding agents spend part of their time waiting for a person. An approval needs
a decision. A question needs an answer. The terminal may be ready for the next
instruction while attention is somewhere else. I built Agent Navi to give those
moments a familiar sound cue.

The name gives away the voice: Navi from The Legend of Zelda: Ocarina of Time.
The project uses five familiar clips and provides native sound integrations
for Claude Code, Codex, and Gemini CLI. There is also an independent Codex pet.
The project is free to try, and its code is public.

The recognizable sound is the introduction. The more interesting engineering
question is what a notification should be allowed to affect. My answer was
deliberately small. It should play a cue, respect configuration, and leave the
agent's decisions alone. A missing speaker should not become an error in the
coding task.

Agent Navi's host hooks return promptly and dispatch playback to a detached
worker. They fail open on malformed input, missing audio, invalid configuration,
and playback failure. They do not approve or block actions, and they never log
prompts or transcripts. Codex Stop and Gemini hooks return the neutral JSON
those hosts require.

The shared player uses Node.js 22 or newer with no npm runtime dependencies.
macOS uses its built-in player. Linux uses an available supported player.
Windows uses Windows PowerShell and its sound API, without requiring Git Bash.
That keeps installation relatively small, while making one important dependency
explicit: there still has to be a working audio device where the hook runs.
SSH and containers do not acquire laptop speakers by implication.

Host differences stay visible. Claude Code exposes input and idle notifications
that do not have native Codex mappings in this release. The project does not
invent those events by reading assistant prose. Separate registrations map
documented host events onto the same player. The generic event interface remains
available for scripts and other agents.

There is also a limit to how much attention a notification deserves. Repeated
events have a cooldown, overlapping clips are dropped, and completion/error
cues are off by default. The attention preset disables session and prompt cues
while keeping the supported attention events. Individual mutes and a global
mute let people choose their own threshold.

The pet is intentionally separate. Someone can install sounds without a pet,
download the pet without Node.js, or use both. Installing it does not select it
in the host or enable hooks. The host drives its activity and animation. File
conflicts are preserved rather than silently overwritten, and explicit replacement
through the CLI creates a backup.

Testing has similar boundaries. The automated suite covers payloads, configuration,
deduplication, failure behavior, packaging, and filesystem operations. Players
are simulated. That is useful evidence about the code, but it is not evidence
that every physical audio setup or native pet surface has been tested. The
compatibility documentation makes that distinction explicit.

The project also separates its licenses: MIT for code and configuration,
CC BY 4.0 for contributor rights in the artwork, and a separate notice for the
Nintendo-derived recordings. There is no claim of official affiliation or
ownership of Nintendo's character or audio.

If you try Navi, I would like to know which cues you keep and where setup gets
confusing. Those answers are more useful than another feature imagined in
advance of someone needing it.

[Install Agent Navi](https://github.com/mitchtech/agent-navi#sounds-only)
or [preview the sounds and animations](https://mitchtech.github.io/agent-navi/).
