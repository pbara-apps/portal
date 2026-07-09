#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");

const replacements = [
  [/^"use client";\n\n?/gm, ""],
  [/from "@\/service\/apis\//g, 'from "@/lib/api/'],
  [/from "@\/components\/admin\//g, 'from "@/features/admin/components/'],
  [/from "@\/components\/auth\//g, 'from "@/features/auth/components/'],
  [
    /from "@\/components\/shared\/toast-notification\/toast-notification"/g,
    'from "@/components/shared/toast-notification"',
  ],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

for (const file of walk(ROOT)) {
  let content = fs.readFileSync(file, "utf8");
  let next = content;
  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }
  if (next !== content) fs.writeFileSync(file, next);
}

console.log("Path migration complete.");
