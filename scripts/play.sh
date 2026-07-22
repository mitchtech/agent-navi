#!/usr/bin/env bash
# claude-navi: play Navi audio in response to Claude Code hook events.
# Reads a Claude Code hook JSON payload from stdin and dispatches to afplay.
# Silent (exit 0) on any unknown event, missing jq, or missing audio file.

set -euo pipefail

INPUT=$(cat)
EVENT=$(printf '%s' "$INPUT" | jq -r '.hook_event_name // empty' 2>/dev/null || true)

FILE=""
case "$EVENT" in
  UserPromptSubmit)
    # Randomize between Hey! and Look! so it doesn't get grating.
    if [ $(( RANDOM % 2 )) -eq 0 ]; then
      FILE="hey.wav"
    else
      FILE="look.wav"
    fi
    ;;
  SessionStart)
    FILE="hello.wav"
    ;;
  Notification)
    NTYPE=$(printf '%s' "$INPUT" | jq -r '.notification_type // empty' 2>/dev/null || true)
    case "$NTYPE" in
      permission_prompt)
        # If the pending tool is Bash (or another destructive tool), escalate
        # to "Watch out!" instead of the default "Hey!"
        PENDING_TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // .pending_tool // empty' 2>/dev/null || true)
        case "$PENDING_TOOL" in
          Bash|Write|Edit|NotebookEdit) FILE="watchout.wav" ;;
          *)                            FILE="hey.wav" ;;
        esac
        ;;
      idle_prompt) FILE="listen.wav" ;;
      *) exit 0 ;;
    esac
    ;;
  *)
    exit 0
    ;;
esac

[ -z "$FILE" ] && exit 0

ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
AUDIO="$ROOT/audio/$FILE"
[ -f "$AUDIO" ] || exit 0

(afplay "$AUDIO" >/dev/null 2>&1 &)
disown 2>/dev/null || true
exit 0
