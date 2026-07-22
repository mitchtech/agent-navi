# claude-navi

**Hey! Listen!**

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin that plays
Navi the Fairy's iconic *"Hey!"* and *"Listen!"* voice clips from
*The Legend of Zelda: Ocarina of Time* when Claude needs your attention.

Inspired by [thephw/claude-meseeks](https://github.com/thephw/claude-meseeks) — same idea, better fairy.

## Install

```
/plugin marketplace add mitchtech/claude-navi
/plugin install navi@claude-navi
```

Or install locally from a clone:

```
/plugin marketplace add /path/to/claude-navi
/plugin install navi@claude-navi
```

## Hook mapping

| Claude Code event | Navi clip | When it plays |
|---|---|---|
| `SessionStart` | **Hello!** | You open a Claude Code session |
| `UserPromptSubmit` | **Hey!** *or* **Look!** *(random)* | You submit a prompt |
| `Notification` / `permission_prompt` (Bash / Write / Edit / NotebookEdit) | **Watch out!** | Claude wants permission for a destructive tool |
| `Notification` / `permission_prompt` (other tools) | **Hey!** | Claude wants permission for something benign |
| `Notification` / `idle_prompt` | **Listen!** | Claude is idle, waiting on you |
| any other event or Notification subtype | *(silent)* | — |

No `Stop` hook — it fires on every subagent return and would be far too chatty.
No `PreToolUse` — it fires on every tool call including auto-approved ones,
which would turn Watch out! into a constant siren. The `permission_prompt`
subtype is the actual "user, look at this" signal.

## Replacing the audio

The bundled clips live in `audio/`:

- `hey.wav` — "Hey!"
- `listen.wav` — "Listen!"
- `hello.wav` — "Hello!"
- `look.wav` — "Look!"
- `watchout.wav` — "Watch out!"

Swap in any 16-bit PCM WAV of your choice — Skyward Sword Fi, Ocarina of Time
Sheik, your own voice, whatever. Same filenames, same directory, done.

## Requirements

- **macOS** — uses the built-in `afplay`
- **`jq`** — for parsing hook JSON (`brew install jq`)

## Troubleshooting

Test the script directly, bypassing Claude Code:

```bash
echo '{"hook_event_name":"SessionStart"}' | ./scripts/play.sh
echo '{"hook_event_name":"UserPromptSubmit"}' | ./scripts/play.sh
echo '{"hook_event_name":"Notification","notification_type":"permission_prompt","tool_name":"Bash"}' | ./scripts/play.sh
echo '{"hook_event_name":"Notification","notification_type":"permission_prompt","tool_name":"WebFetch"}' | ./scripts/play.sh
echo '{"hook_event_name":"Notification","notification_type":"idle_prompt"}' | ./scripts/play.sh
```

The script is deliberately silent on unknown events, missing `jq`, or missing
audio files — it will never block a Claude Code turn.

## Credits

- **Navi**, *The Legend of Zelda: Ocarina of Time* — © Nintendo
- Plugin skeleton inspired by [thephw/claude-meseeks](https://github.com/thephw/claude-meseeks)
- Author: [mitchtech](https://github.com/mitchtech)

## License

Code: MIT. Audio: personal, non-commercial use only. See [LICENSE](./LICENSE).
