#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|html|css)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(root);
let hits = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (/type=["']password["']/i.test(text)) {
    console.error("password field", file);
    hits++;
  }
  if (/1f916_sk_/i.test(text)) {
    console.error("citizen secret literal", file);
    hits++;
  }
  if (/method:\s*["']POST["']/i.test(text) || /method:\s*["']PUT["']/i.test(text)) {
    console.error("write method", file);
    hits++;
  }
}

const html = readFileSync(join(root, "index.html"), "utf8");
if (!/READ-ONLY/i.test(html)) {
  console.error("missing READ-ONLY pledge");
  hits++;
}

if (hits) process.exit(1);
console.log("readonly ok ·", files.length, "files");
