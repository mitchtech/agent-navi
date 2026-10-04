# Migrating to Agent Navi

The repository and marketplace are now `agent-navi`. The plugin identifier
remains `navi`; install it as `navi@agent-navi`. The old installation identity
is not supported. Remove the old plugin before installing the new one to avoid
duplicate sounds.

## Claude Code

```text
/plugin uninstall navi@claude-navi
/plugin marketplace remove claude-navi
/plugin marketplace add mitchtech/agent-navi
/plugin install navi@agent-navi
```

## Codex

If the old plugin appears in Codex's installed plugins, remove it there as well:

```bash
codex plugin remove navi@claude-navi
codex plugin marketplace remove claude-navi
codex plugin marketplace add mitchtech/agent-navi
codex plugin add navi@agent-navi
```

Skip removal commands for sources that were never installed. Review and trust
the new hooks, then restart both agents. Manage installations through the host
commands rather than deleting plugin caches or editing generated registries.

## Existing clones

```bash
git remote set-url origin git@github.com:mitchtech/agent-navi.git
```

Rename the checkout directory to `agent-navi` after closing processes that use
its old path. Reopen the renamed folder in your editor/agent. Update any saved
workspace paths, project trust entries, shell aliases, and manually configured
hook commands that reference the old folder or `scripts/play.sh`. Hook payloads
now enter through `node /path/to/agent-navi/scripts/navi.mjs hook --agent claude`
or `--agent codex`.

GitHub redirects old repository URLs and Git operations, but local settings and
marketplace identities do not rename themselves. Do not create another
repository at `mitchtech/claude-navi`; that would replace the redirect.
See [GitHub's rename documentation](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository).

## Runtime and behavior

- Install Node.js 22+; Bash and `jq` are no longer required.
- Hello! and prompt Hey!/Look! remain enabled.
- Tool-aware permission sounds use `PermissionRequest`.
- Claude idle/input notifications remain enabled; Codex has no equivalent native mapping here.
- Completion and error sounds are optional and disabled by default.
- Subagent completion and compaction remain silent.
- Copy custom clips out of old plugin caches before removing an installation.
- Store replacement audio and configuration in your user-owned Agent Navi directory.
- Run `node scripts/navi.mjs doctor` after migration.
