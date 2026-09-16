#!/usr/bin/env node
// PreToolUse hook (Bash): blocks git/shell commands that are destructive or
// hard to reverse, per CLAUDE.md -> Forbidden Practices (force-push,
// --no-verify, history rewrite, hard reset, recursive delete). Requires the
// user's explicit go-ahead in chat before retrying -- this hook can't itself
// distinguish "confirmed" from "not confirmed", so it always stops.

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const command = input?.tool_input?.command || "";

  const rules = [
    [/\bgit\s+push\b[^\n]*(--force\b|(?<!--force-with-lease)\s-f\b)/, "force-push"],
    [/--force-with-lease/, "force-push (--force-with-lease)"],
    [/\bgit\s+reset\s+--hard\b/, "git reset --hard"],
    [/\bgit\s+clean\s+[^\n]*-f/, "git clean -f"],
    [/--no-verify\b/, "--no-verify (skips hooks)"],
    [/\bgit\s+filter-repo\b/, "git filter-repo (history rewrite)"],
    [/\bfilter-branch\b/, "git filter-branch (history rewrite)"],
    [/\brm\s+-[a-z]*r[a-z]*f[a-z]*\b/i, "rm -rf"],
    [/\brm\s+-[a-z]*f[a-z]*r[a-z]*\b/i, "rm -fr"],
    [/\bgit\s+branch\s+-D\b/, "git branch -D (force branch delete)"],
  ];

  for (const [pattern, label] of rules) {
    if (pattern.test(command)) {
      process.stderr.write(
        `Blocked by dangerous-command-guard: command matches "${label}", which CLAUDE.md's Forbidden Practices requires explicit user confirmation for. ` +
          `Do not retry this command on your own -- stop and ask the user directly in chat first.`
      );
      process.exit(2);
    }
  }

  process.exit(0);
});
