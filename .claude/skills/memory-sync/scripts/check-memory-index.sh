#!/usr/bin/env bash
# Verifies .claude/memory/MEMORY.md references every topic doc in the folder,
# and that every link inside MEMORY.md points at a file that actually exists.
#
# Usage: check-memory-index.sh   (run from repo root)

set -euo pipefail

memory_dir=".claude/memory"
index="$memory_dir/MEMORY.md"

if [ ! -f "$index" ]; then
    echo "Missing $index" >&2
    exit 1
fi

problems=0

for f in "$memory_dir"/*.md; do
    base=$(basename "$f")
    [ "$base" = "MEMORY.md" ] && continue
    if ! grep -qF "($base)" "$index"; then
        echo "ORPHAN: $base exists but is not linked from MEMORY.md"
        problems=1
    fi
done

while read -r target; do
    [ -z "$target" ] && continue
    if [ ! -f "$memory_dir/$target" ]; then
        echo "DEAD LINK: MEMORY.md points at $target, which does not exist"
        problems=1
    fi
done < <(grep -oE '\[[^]]+\]\(([a-zA-Z0-9_-]+\.md)\)' "$index" | grep -oE '\(([a-zA-Z0-9_-]+\.md)\)' | tr -d '()' | sort -u)

if [ "$problems" = "0" ]; then
    echo "OK: MEMORY.md index is in sync with $memory_dir/"
fi

exit "$problems"
