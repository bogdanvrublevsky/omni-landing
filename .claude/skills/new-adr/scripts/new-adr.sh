#!/usr/bin/env bash
# Scaffolds a new ADR file with the next sequential number.
#
# Usage: new-adr.sh "short-kebab-slug" "Human readable title"

set -euo pipefail

if [ "$#" -lt 2 ]; then
    echo "Usage: new-adr.sh <slug> <title>" >&2
    exit 1
fi

slug="$1"
title="$2"
adr_dir="docs/adr"

if [ ! -d "$adr_dir" ]; then
    echo "Expected $adr_dir to exist — run this from the repo root." >&2
    exit 1
fi

last_num=$(ls "$adr_dir" | grep -E '^[0-9]{4}-.*\.md$' | sed -E 's/^([0-9]{4})-.*/\1/' | sort -n | tail -1)
if [ -z "$last_num" ]; then
    next_num="0001"
else
    next_num=$(printf "%04d" $((10#$last_num + 1)))
fi

file="$adr_dir/${next_num}-${slug}.md"
if [ -e "$file" ]; then
    echo "$file already exists." >&2
    exit 1
fi

today=$(date +%F)

cat > "$file" <<EOF
# ${next_num} — ${title}

- **Статус:** предложено
- **Дата:** ${today}

## Контекст

## Проблема

## Варианты

1.
2.

## Принятое решение

## Последствия

EOF

echo "Created $file"
echo "Next: fill in Контекст/Проблема/Варианты/Решение/Последствия, then add a row to $adr_dir/README.md"
