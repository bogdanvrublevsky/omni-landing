#!/usr/bin/env node
// PreToolUse hook (Edit|Write|MultiEdit): blocks tool calls that touch a
// head element, per CLAUDE.md -> AI Workflow (Claude never edits it autonomously).
// Only applies to markup files (.html/.htm/.astro) -- source files that merely
// mention the tag name as text (like this script) are never in scope.
//
// Edit/MultiEdit snippets (old_string/new_string) rarely contain the head
// opening tag themselves -- they're just the changed line. So instead of
// pattern-matching the snippet, this reads the file from disk and checks
// whether the snippet's position falls inside the head element's range.
//
// Regex literals only below (not `new RegExp("string")`) -- a JS string
// literal silently drops backslashes it doesn't recognize (e.g. "\s" -> "s"),
// which quietly breaks patterns built that way. A regex literal has no such
// double-escaping trap.

const fs = require("fs");

const HEAD_OPEN = /<head[\s>]/i;
const HEAD_CLOSE = /<\/head\s*>/i;
const HEAD_BLOCK = /<head[\s>][\s\S]*<\/head\s*>/i;
const MARKUP_EXT = /\.(html?|astro)$/i;

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolName = input?.tool_name || "";
  const ti = input?.tool_input || {};
  const filePath = ti.file_path || "";

  if (!MARKUP_EXT.test(filePath)) {
    process.exit(0);
  }

  const block = (reason) => {
    process.stderr.write(
      "Blocked by head-guard: " + reason + " CLAUDE.md requires explicit user confirmation before any head-element change -- stop and ask the user instead of editing it."
    );
    process.exit(2);
  };

  if (toolName === "Write") {
    if (typeof ti.content === "string" && HEAD_BLOCK.test(ti.content)) {
      block('the written content for "' + filePath + '" contains a head element.');
    }
    process.exit(0);
  }

  if (!fs.existsSync(filePath)) {
    process.exit(0);
  }

  let fileContent;
  try {
    fileContent = fs.readFileSync(filePath, "utf8");
  } catch {
    process.exit(0);
  }

  const headStartMatch = fileContent.match(HEAD_OPEN);
  const headEndMatch = fileContent.match(HEAD_CLOSE);
  if (!headStartMatch || !headEndMatch) {
    process.exit(0);
  }
  const headStart = headStartMatch.index;
  const headEnd = headEndMatch.index + headEndMatch[0].length;

  const snippets =
    toolName === "MultiEdit" && Array.isArray(ti.edits)
      ? ti.edits.map((e) => e.old_string).filter(Boolean)
      : [ti.old_string].filter(Boolean);

  const touchesHead = snippets.some((snippet) => {
    const idx = fileContent.indexOf(snippet);
    return idx !== -1 && idx >= headStart && idx < headEnd;
  });

  if (touchesHead) {
    block('the edit to "' + filePath + '" falls inside its head element.');
  }

  process.exit(0);
});
