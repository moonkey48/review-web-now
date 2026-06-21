import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const strict = process.argv.includes("--strict");

async function readText(path) {
  return readFile(join(root, path), "utf8");
}

function sriSha384(text) {
  return "sha384-" + createHash("sha384").update(text).digest("base64");
}

function hasAll(text, needles) {
  return needles.every((needle) => text.includes(needle));
}

const pkg = JSON.parse(await readText("package.json"));
const widget = await readText("dist/widget.js");
const buildScript = await readText("scripts/build-widget.mjs");
const readme = await readText("README.md");
const template = await readText("templates/index.html");

const tag = `v${pkg.version}`;
const cdn = `https://cdn.jsdelivr.net/gh/moonkey48/review-web-now@${tag}/dist/widget.js`;
const sri = sriSha384(widget);

const checks = [
  {
    name: "build-widget CDN constants",
    ok: hasAll(buildScript, [cdn, sri]),
  },
  {
    name: "README install snippet",
    ok: hasAll(readme, [cdn, sri, `@${tag}`]),
  },
  {
    name: "install page template",
    ok: hasAll(template, [cdn, sri, `@${tag}`]),
  },
];

console.log(`[release-check] package version ${pkg.version}`);
console.log(`[release-check] expected CDN ${cdn}`);
console.log(`[release-check] dist/widget.js SRI ${sri}`);
for (const c of checks) {
  console.log(`[release-check] ${c.ok ? "ok" : "mismatch"}: ${c.name}`);
}

const failed = checks.filter((c) => !c.ok);
if (failed.length && strict) {
  console.error("[release-check] strict mode failed");
  process.exit(1);
}
if (failed.length) {
  console.log("[release-check] run with --strict in CI/release jobs to fail on mismatches");
}
