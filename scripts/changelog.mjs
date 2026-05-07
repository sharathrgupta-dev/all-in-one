#!/usr/bin/env node
/**
 * Auto-generates CHANGELOG.md from git log.
 * Run manually: npm run changelog
 * Runs automatically via .githooks/post-commit after every commit.
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ── Fetch git log ────────────────────────────────────────────────────────────

const raw = execSync(
  'git log --format="%H|%ad|%s" --date=short --all',
  { cwd: ROOT, encoding: "utf8" }
).trim();

if (!raw) {
  console.log("No commits found.");
  process.exit(0);
}

const commits = raw.split("\n").map((line) => {
  const [hash, date, ...rest] = line.split("|");
  return { hash: hash.slice(0, 7), date, message: rest.join("|").trim() };
});

// ── Group by date ─────────────────────────────────────────────────────────────

const byDate = new Map();
for (const c of commits) {
  if (!byDate.has(c.date)) byDate.set(c.date, []);
  byDate.get(c.date).push(c);
}

// Sorted newest first
const sortedDates = [...byDate.keys()].sort((a, b) => (a < b ? 1 : -1));

// ── Classify commit message ──────────────────────────────────────────────────

function classify(msg) {
  const lower = msg.toLowerCase();
  if (/^feat[:(]/.test(lower) || /^add\b/.test(lower))   return "Added";
  if (/^fix[:(]/.test(lower))                              return "Fixed";
  if (/^refactor[:(]/.test(lower))                         return "Changed";
  if (/^perf[:(]/.test(lower))                             return "Performance";
  if (/^chore[:(]/.test(lower) || /^ci[:(]/.test(lower))  return "Chore";
  if (/^docs[:(]/.test(lower))                             return "Docs";
  if (/^remove[:(]|^delete[:(]/.test(lower))               return "Removed";
  if (/^update\b/.test(lower))                             return "Changed";
  return "Changed";
}

function cleanMessage(msg) {
  // Strip conventional commit prefix (feat:, fix:, refactor:, etc.)
  return msg.replace(/^(feat|fix|refactor|chore|docs|perf|ci|test|style|build|revert)(\(.+?\))?:\s*/i, "");
}

// ── Build markdown ────────────────────────────────────────────────────────────

const lines = [
  "# Changelog",
  "",
  "> Auto-generated from git log. Run `npm run changelog` to refresh.",
  "",
];

for (const date of sortedDates) {
  const dayCommits = byDate.get(date);

  lines.push(`## ${date}`);
  lines.push("");

  // Group by type within the day
  const groups = {};
  for (const c of dayCommits) {
    const type = classify(c.message);
    if (!groups[type]) groups[type] = [];
    groups[type].push(c);
  }

  const ORDER = ["Added", "Fixed", "Changed", "Performance", "Removed", "Chore", "Docs"];
  for (const type of ORDER) {
    if (!groups[type]) continue;
    lines.push(`### ${type}`);
    for (const c of groups[type]) {
      lines.push(`- ${cleanMessage(c.message)} (\`${c.hash}\`)`);
    }
    lines.push("");
  }
}

// ── Write file ────────────────────────────────────────────────────────────────

const output = lines.join("\n").trimEnd() + "\n";
writeFileSync(resolve(ROOT, "CHANGELOG.md"), output, "utf8");
console.log(`✓ CHANGELOG.md updated (${commits.length} commits across ${sortedDates.length} days)`);
