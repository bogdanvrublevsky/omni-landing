#!/usr/bin/env node
// PreToolUse hook (Edit|Write|MultiEdit|NotebookEdit): blocks edits to
// files inside the parts of the monorepo that are out of scope for this
// CLAUDE.md (see CLAUDE.md -> Scope, docs/adr/0006-monorepo-scope-boundary.md).
// Forces Claude to stop and ask the user instead of silently touching
// dlext/, ttapp/, sgame/, treev/.

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // can't parse -> don't block on our own failure
  }

  const filePath = input?.tool_input?.file_path || "";
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();

  const guarded = ["dlext", "ttapp", "treev"];
  const hit = guarded.find((name) =>
    new RegExp(`(^|/)${name}(/|$)`).test(normalized)
  );

  if (hit) {
    process.stderr.write(
      `Blocked by scope-guard: "${filePath}" is inside "${hit}/", which is outside the scope of CLAUDE.md ` +
      `(see docs/adr/0006-monorepo-scope-boundary.md). Stop and ask the user for explicit confirmation before editing this path.`
    );
    process.exit(2);
  }

  process.exit(0);
});
