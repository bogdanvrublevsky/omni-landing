#!/usr/bin/env bash
# Thin wrapper for a deep manual secrets audit. Reuses the same scan logic
# as the pre-commit hook (.claude/hooks/scripts/scan-secrets.sh) instead of
# duplicating it — this script just runs it in --all mode (every tracked
# file, not just staged ones).
#
# Usage: run-audit.sh   (run from repo root)

set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
"$repo_root/.claude/hooks/scripts/scan-secrets.sh" --all
