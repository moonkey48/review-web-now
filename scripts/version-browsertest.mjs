// 버전 관리 e2e: 기존 v0.4.x(버전 없는) 코멘트를 seed → 마운트 시 마이그레이션 → 핀 색·가시성·bump 검증.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const widget = await readFile(join(root, "dist/widget.js"), "utf8");
const out = join(tmpdir(), "rv-version-test");
await mkdir(out, { recursive: true });

const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<main style="padding:60px">
  <h1 id="t1" style="font-size:24px">리뷰 대상 1</h1>
  <h2 id="t2" style="margin-top:24px">리뷰 대상 2</h2>
</main>
<script>
  // v0.4.x 스타일: version 필드 없는 코멘트 2건 seed
  localStorage.clear();
  localStorage.setItem("rv:comments", JSON.stringify([
    { id:"old1", pagePath: location.pathname, pageUrl: location.href,
      anchor:{type:"pin", selector:"#t1", xPercent:50, yPercent:50},
      body:"옛 리뷰 1", authorName:"옛사람", resolved:false, resolvedAt:null,
      createdAt:"2026-06-17T00:00:00Z", updatedAt:"2026-06-17T00:00:00Z" },
    { id:"old2", pagePath: location.pathname, pageUrl: location.href,
      anchor:{type:"pin", selector:"#t2", xPercent:50, yPercent:50},
      body:"옛 리뷰 2", authorName:"옛사람", resolved:false, resolvedAt:null,
      createdAt:"2026-06-17T00:01:00Z", updatedAt:"2026-06-17T00:01:00Z" }
  ]));
  window.__RV_FORCE__ = 1;
</script>
<script>${widget}</script>
</body></html>`;

await writeFile(join(out, "version-test.html"), html, "utf8");
console.log(join(out, "version-test.html"));
