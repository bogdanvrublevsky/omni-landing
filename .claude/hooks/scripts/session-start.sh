#!/usr/bin/env bash
# SessionStart hook: reminds Claude of the scope boundary every new session,
# so it doesn't have to be rediscovered from CLAUDE.md each time before
# touching a file. See CLAUDE.md -> Scope, docs/adr/0006-monorepo-scope-boundary.md.

cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "anltx repo scope reminder: CLAUDE.md governs only main/, .claude/, docs/, and root configs. dlext/, ttapp/, sgame/, treev/ are out of scope (docs/adr/0006) -- stop and ask before touching them. <head> changes always require explicit user confirmation (docs/adr/0006, CLAUDE.md -> AI Workflow)."
  }
}
EOF
