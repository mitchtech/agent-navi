---
name: navi-control
disable-model-invocation: false
description: >-
  Inspect and control Agent Navi sound notifications without changing pet selection.
  TRIGGER when: the user says "mute Navi", "unmute Navi", "Navi status",
  "turn off prompt sounds", "enable approval sounds", "Navi attention mode",
  "preview a Navi sound", or asks to inspect or adjust Agent Navi notifications.
  DO NOT TRIGGER when: the user wants operating system volume controls, unrelated
  notification settings, pet artwork repair, or pet selection through the host picker.
---

# Navi sound controls

Resolve this installed SKILL.md's directory. The bundled CLI is
`../../scripts/navi.mjs` relative to it. Run it with Node and a quoted absolute
path, rather than assuming a global `agent-navi` executable is installed.

- Inspect: `status`, `status --json`, `list`, or `config --effective`.
- Mute/unmute: `mute EVENT|all` or `unmute EVENT|all`.
- Presets: `preset attention` or `preset default`.
- Requested sound preview: `preview CLIP`.

Use `list` to resolve supported event and clip names. Translate a clear request
into the corresponding event: prompt sounds are `prompt_submitted`, approval
sounds are `approval_required`, questions are `input_required`, and ready
notifications are `ready_for_input`. Ask only when the requested event is unclear.

Change preferences only when the user requests that change. Inspection and
troubleshooting do not imply muting, unmuting, applying a preset, or playing audio.
Always specify an event or explicit `all`. Global mute/unmute preserves event
preferences. Presets change event enablement and preserve clips and global mute.

Changes persist outside plugin caches and take effect on the next hook. Report
the resulting status. If `AGENT_NAVI_MUTE` overrides the saved preference, explain
that the user must change it in the agent's launch environment. Do not modify
shell startup files or host configuration automatically.

Pet installation and selection are independent. These controls never change
pets, register hooks, or approve agent actions.
