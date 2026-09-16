#!/usr/bin/env node
// PreToolUse hook (Bash): if the command being run is a `git commit`, runs
// the shared secrets scanner first and blocks the commit if it finds
// anything. No-op for every other Bash command.
//
// PreToolUse fires once, before the ENTIRE command string runs -- so if a
// single Bash call chains `git add ... && git commit ...`, the add hasn't
// happened yet at hook time and `git diff --cached` would see nothing. When
// both `git add` and `git commit` appear in the same command, this scans
// every tracked file (--all) instead of just the index, as a safe fallback.
// A standalone `git commit` (files staged by an earlier, separate call)
// uses the fast staged-only check.

const { spawnSync } = require("child_process");
const path = require("path");

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
  if (!/\bgit\s+commit\b/.test(command)) {
    process.exit(0);
  }

  const chainedAdd = /\bgit\s+add\b/.test(command);

  const cwd = input?.cwd || process.cwd();
  const scriptPath = path.join(cwd, ".claude", "hooks", "scripts", "scan-secrets.sh");
  const args = chainedAdd ? [scriptPath, "--all"] : [scriptPath];

  const result = spawnSync("bash", args, { cwd, encoding: "utf8" });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    process.stderr.write(
      `Blocked by secrets-precommit: scan-secrets.sh found a likely secret (${chainedAdd ? "--all" : "staged"} mode).\n${output}`
    );
    process.exit(2);
  }

  process.exit(0);
});
