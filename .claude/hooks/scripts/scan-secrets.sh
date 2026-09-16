#!/usr/bin/env bash
# Scans files for likely secrets. Used both as the pre-commit hook (staged files)
# and manually by the security-secrets-audit skill (arbitrary paths / --all).
#
# Usage:
#   scan-secrets.sh              # scan git-staged files (hook mode)
#   scan-secrets.sh --all        # scan every tracked file (deep audit mode)
#   scan-secrets.sh <path>...    # scan specific paths
#
# Exit code 0 = clean, 1 = likely secret found.

set -euo pipefail

mode="${1:-}"

if [ "$mode" = "--all" ]; then
    files=$(git ls-files)
elif [ "$#" -ge 1 ]; then
    files="$*"
else
    files=$(git diff --cached --name-only --diff-filter=ACM)
fi

if [ -z "$files" ]; then
    exit 0
fi

found=0

# Patterns: PEM private keys, AWS access keys, Telegram bot tokens,
# generic password/secret/token/apikey assignments with a non-empty literal value.
pattern='-----BEGIN [A-Z ]*PRIVATE KEY-----'
pattern="$pattern|AKIA[0-9A-Z]{16}"
pattern="$pattern|[0-9]{8,10}:[A-Za-z0-9_-]{30,45}"
pattern="$pattern|(password|passwd|secret|token|api[_-]?key)['\"]?[[:space:]]*[:=][[:space:]]*['\"][^'\"[:space:]]{6,}['\"]"

for f in $files; do
    [ -f "$f" ] || continue
    case "$f" in
        *.lock|*.min.js|*.svg|*.png|*.jpg|*.jpeg|*.gif|*.ico) continue ;;
    esac

    matches=$(grep -nEi -e "$pattern" "$f" 2>/dev/null || true)
    if [ -n "$matches" ]; then
        echo "POTENTIAL SECRET in $f:"
        echo "$matches" | sed 's/^/  /'
        found=1
    fi

    base=$(basename "$f")
    case "$base" in
        .env|.env.*|*.env|.dev.vars|.dev.vars.*|credentials.json|*credentials*.json|*.pem|*.p12)
            echo "SECRET-LIKE FILE staged for commit: $f"
            found=1
            ;;
    esac
done

if [ "$found" = "1" ]; then
    echo ""
    echo "Commit blocked: remove the secret, use an env var / platform secret store instead, and re-run."
    exit 1
fi

exit 0
