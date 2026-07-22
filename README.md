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
| `UserPromptSubmit` | **Hey!** | You submit a prompt |
| `Notification` / `permission_prompt` | **Hey!** | Claude is asking to run something |
| `Notification` / `idle_prompt` | **Listen!** | Claude is idle, waiting on you |
| any other Notification subtype | *(silent)* | — |

No `Stop` hook — it fires on every subagent return and would be far too chatty.

## Replacing the audio

The bundled clips live in `audio/hey.wav` and `audio/listen.wav`. Swap in any
16-bit PCM WAV of your choice — Skyward Sword Fi, Ocarina of Time Sheik, your
own voice, whatever. Same filenames, same directory, done.

## Requirements

- **macOS** — uses the built-in `afplay`
- **`jq`** — for parsing hook JSON (`brew install jq`)

## Troubleshooting

Test the script directly, bypassing Claude Code:

```bash
echo '{"hook_event_name":"UserPromptSubmit"}' | ./scripts/play.sh
echo '{"hook_event_name":"Notification","notification_type":"permission_prompt"}' | ./scripts/play.sh
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
