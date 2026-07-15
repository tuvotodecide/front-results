import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const roots = ["tests", path.join("cypress", "e2e", "smoke")];
const filePattern = /\.(test|spec|cy)\.[cm]?[jt]sx?$/;
const forbiddenPatterns = [
  /\b(describe|it|test)\.only\s*\(/,
  /\b(describe|it|test)\.skip\s*\(/,
  /\b(?:xdescribe|xit)\s*\(/,
  /\b(?:it|test)\.todo\s*\(/,
];

const walk = (dir) => {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      entries.push(...walk(fullPath));
    } else if (filePattern.test(fullPath)) {
      entries.push(fullPath);
    }
  }
  return entries;
};

const violations = [];

for (const root of roots) {
  for (const file of walk(root)) {
    const content = readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (forbiddenPatterns.some((pattern) => pattern.test(line))) {
        violations.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
}

if (violations.length > 0) {
  console.error("Focused, skipped or todo tests are not allowed in active suites:");
  violations.forEach((violation) => console.error(`- ${violation}`));
  process.exit(1);
}

console.log("No focused, skipped or todo tests found in active suites.");
