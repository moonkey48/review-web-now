import esbuild from "esbuild";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(tmpdir(), "rv-browser-selftest");
await mkdir(out, { recursive: true });
let profileSeq = 0;

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd: root, maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

function runShell(command) {
  return run("/bin/zsh", ["-lc", command]);
}

function shQuote(s) {
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

function chromeBin() {
  return (
    process.env.CHROME_BIN ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  );
}

async function dumpDom(fileUrl) {
  const profile = join(out, "chrome-profile-" + ++profileSeq);
  const domOut = join(out, "dom-" + profileSeq + ".html");
  const errOut = join(out, "chrome-" + profileSeq + ".log");
  await mkdir(profile, { recursive: true });
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-dev-shm-usage",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=5000",
    "--user-data-dir=" + profile,
    "--dump-dom",
    fileUrl,
  ];
  const command =
    [
      "env",
      "-i",
      "HOME=" + process.env.HOME,
      "PATH=" + (process.env.PATH || "/usr/bin:/bin:/usr/sbin:/sbin"),
      "TMPDIR=" + (process.env.TMPDIR || tmpdir()),
      chromeBin(),
      ...args,
    ].map(shQuote).join(" ") +
    " > " + shQuote(domOut) +
    " 2> " + shQuote(errOut);
  await runShell(command);
  return readFile(domOut, "utf8");
}

function jsonFromPre(dom) {
  const m = /<pre id="out">([\s\S]*?)<\/pre>/.exec(dom);
  if (!m) throw new Error("No #out pre found in browser output");
  return JSON.parse(
    m[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  );
}

async function generateAnchorHarness() {
  const { stdout } = await run(process.execPath, [join(root, "scripts/anchor-browsertest.mjs")]);
  return stdout.trim().split(/\r?\n/).pop();
}

async function runAnchorHarness() {
  const filePath = await generateAnchorHarness();
  const result = jsonFromPre(await dumpDom("file://" + filePath));
  if (result.passed !== result.total) {
    throw new Error("anchor harness failed: " + JSON.stringify(result.fails));
  }
  return result.total;
}

async function buildWidgetHarness() {
  const res = await esbuild.build({
    entryPoints: [join(root, "widget/index.tsx")],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2019",
    jsx: "automatic",
    jsxImportSource: "preact",
    minify: true,
    write: false,
    logLevel: "error",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const widget = res.outputFiles[0].text;
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<main style="padding:60px">
  <h1 id="exact">정확한 현재 화면 리뷰</h1>
  <h2 id="legacy">레거시 pathname 리뷰</h2>
  <h3 id="other">다른 쿼리 화면 리뷰</h3>
</main>
<script>
  localStorage.clear();
  var currentKey = location.pathname + location.search + location.hash;
  localStorage.setItem("rv:comments", JSON.stringify([
    { id:"exact", pagePath: currentKey, pageUrl: location.href, anchor:{type:"pin", selector:"#exact", xPercent:50, yPercent:50}, body:"exact", authorName:"t", version:"v1", resolved:false, resolvedAt:null, createdAt:"2026-06-21T00:00:00Z", updatedAt:"2026-06-21T00:00:00Z" },
    { id:"legacy", pagePath: location.pathname, pageUrl: location.href, anchor:{type:"pin", selector:"#legacy", xPercent:50, yPercent:50}, body:"legacy", authorName:"t", version:"v1", resolved:false, resolvedAt:null, createdAt:"2026-06-21T00:01:00Z", updatedAt:"2026-06-21T00:01:00Z" },
    { id:"other", pagePath: location.pathname + "?tab=done#pane", pageUrl: location.href, anchor:{type:"pin", selector:"#other", xPercent:50, yPercent:50}, body:"other", authorName:"t", version:"v2", resolved:false, resolvedAt:null, createdAt:"2026-06-21T00:02:00Z", updatedAt:"2026-06-21T00:02:00Z" }
  ]));
  localStorage.setItem("rv:version", "v1");
  localStorage.setItem("rv:versions", JSON.stringify(["v1","v2"]));
  localStorage.setItem("rv:visibleVersions", JSON.stringify(["v1"]));
  window.__RV_FORCE__ = 1;
</script>
<script>${widget}</script>
<pre id="out">running</pre>
<script>
(async function(){
  var results = [];
  var ok = function(name, cond, got){ results.push({ name:name, pass:!!cond, got:got }); };
  var sleep = function(ms){ return new Promise(function(res){ setTimeout(res, ms); }); };
  await sleep(80);
  var host = document.getElementById("reviewer-widget-host");
  var root = host && host.shadowRoot;
  ok("widget mounted", !!root, !!root);
  ok("current key + legacy visible, other query hidden", root.querySelectorAll(".rv-pin").length === 2, root.querySelectorAll(".rv-pin").length);

  location.hash = "changed";
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  await sleep(80);
  ok("hashchange updates route key, legacy remains", root.querySelectorAll(".rv-pin").length === 1, root.querySelectorAll(".rv-pin").length);

  localStorage.setItem("rv:version", "v2");
  localStorage.setItem("rv:visibleVersions", JSON.stringify(["v2"]));
  window.dispatchEvent(new StorageEvent("storage", { key: "rv:version", newValue: "v2" }));
  window.dispatchEvent(new StorageEvent("storage", { key: "rv:visibleVersions", newValue: JSON.stringify(["v2"]) }));
  await sleep(80);
  ok("storage event syncs visible version", root.querySelectorAll(".rv-pin").length === 1, root.querySelectorAll(".rv-pin").length);

  root.querySelector(".rv-fab").click();
  await sleep(50);
  root.querySelector(".rv-btn.rv-btn-primary").click();
  await sleep(80);
  var checked = Array.from(root.querySelectorAll(".rv-ex-ver input")).filter(function(i){ return i.checked; }).length;
  ok("export modal defaults to visible versions", checked === 1, checked);

  var passed = results.filter(function(x){ return x.pass; }).length;
  var result = { passed: passed, total: results.length, fails: results.filter(function(x){ return !x.pass; }) };
  document.getElementById("out").textContent = JSON.stringify(result);
})();
</script>
</body></html>`;
  const p = join(out, "widget-harness.html");
  await writeFile(p, html, "utf8");
  return p;
}

if (!process.argv.includes("--run")) {
  const anchorHarness = await generateAnchorHarness();
  const widgetHarness = await buildWidgetHarness();
  console.log("anchor=file://" + anchorHarness);
  console.log("widget=file://" + widgetHarness + "?tab=open#pane");
} else {
  const anchorCount = await runAnchorHarness();
  const widgetHarness = await buildWidgetHarness();
  const widgetResult = jsonFromPre(await dumpDom("file://" + widgetHarness + "?tab=open#pane"));
  if (widgetResult.passed !== widgetResult.total) {
    throw new Error("widget harness failed: " + JSON.stringify(widgetResult.fails));
  }

  console.log(`browser-selftest: ${anchorCount + widgetResult.total} passed, 0 failed`);
}
