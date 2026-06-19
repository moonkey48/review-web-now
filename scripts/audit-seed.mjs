// 디자인/기능 검증용 — 현재 페이지에 여러 버전·코멘트(+스크린샷 1개)를 seed.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const widget = await readFile(join(root, "dist/widget.js"), "utf8");
const out = join(tmpdir(), "rv-audit");
await mkdir(out, { recursive: true });

const mk = (id, v, body, author, resolved, shot) => ({
  id: "c" + id, version: v, body, authorName: author,
  anchor: { type: "pin", selector: "#a" + id, xPercent: 50, yPercent: 50 },
  shot: shot ? { id: "c" + id, w: 120, h: 80 } : null,
  resolved: !!resolved, resolvedAt: resolved ? "2026-06-18T00:00:00Z" : null,
  createdAt: "2026-06-1" + id + "T00:00:00Z", updatedAt: "2026-06-18T00:00:00Z",
});
const comments = [
  mk(1, "v0", "헤더 로고가 너무 큼", "지수", false, true), // 스크린샷 있음
  mk(2, "v0", "CTA 색이 비활성처럼 보임", "민수", true),
  mk(3, "0.0.1", "큐 카드 간격 좁힘", "지수"),
  mk(4, "0.0.1", "검색 placeholder 영문", "현우"),
  mk(5, "0.0.2", "미리보기 영역 최대폭 제한", "지수"),
  mk(6, "2026-06-18", "토스트 위치 하단 중앙", "민수"),
];
const targets = comments
  .map((c, i) => `<div id="a${i + 1}" style="height:40px;margin:14px 0;border:1px solid #ddd;padding:8px">대상 ${i + 1}</div>`)
  .join("\n");

const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="background:#fafafa">
<main style="padding:40px;max-width:600px"><h1>검증 대상</h1>${targets}</main>
<script>
  localStorage.clear();
  var comments = ${JSON.stringify(comments)}.map(function(c){ c.pagePath = location.pathname; c.pageUrl = location.href; return c; });
  localStorage.setItem("rv:comments", JSON.stringify(comments));
  localStorage.setItem("rv:version", "0.0.3");
  localStorage.setItem("rv:versions", ${JSON.stringify(JSON.stringify(["v0", "0.0.1", "0.0.2", "2026-06-18", "0.0.3"]))});
  localStorage.setItem("rv:schema", "1");
  localStorage.setItem("rv:name", "지수");
  window.__RV_FORCE__ = 1;
</script>
<script>${widget}</script>
</body></html>`;
await writeFile(join(out, "audit.html"), html, "utf8");
console.log(join(out, "audit.html"));
