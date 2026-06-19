// 디자인 감사용 — 여러 버전·코멘트를 seed해 패널의 실제 위계를 평가할 수 있게 한다.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const widget = await readFile(join(root, "dist/widget.js"), "utf8");
const out = join(tmpdir(), "rv-audit");
await mkdir(out, { recursive: true });

const mk = (id, v, body, author, resolved) => ({
  id, pagePath: "/audit", pageUrl: "http://x/audit",
  anchor: { type: "pin", selector: "#a" + id, xPercent: 50, yPercent: 50 },
  body, authorName: author, version: v, resolved: !!resolved,
  resolvedAt: resolved ? "2026-06-18T00:00:00Z" : null,
  createdAt: "2026-06-1" + id + "T00:00:00Z", updatedAt: "2026-06-18T00:00:00Z",
});
const comments = [
  mk(1, "v0", "헤더 로고가 너무 큼", "지수"),
  mk(2, "v0", "CTA 색이 비활성처럼 보임", "민수", true),
  mk(3, "0.0.1", "큐 카드 간격 좁힘", "지수"),
  mk(4, "0.0.1", "검색 placeholder 영문", "현우"),
  mk(5, "0.0.2", "미리보기 영역 최대폭 제한", "지수"),
  mk(6, "2026-06-18", "토스트 위치 하단 중앙", "민수"),
];

const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="background:#fafafa">
<main style="padding:40px"><h1 id="a1">감사 대상</h1></main>
<script>
  localStorage.clear();
  localStorage.setItem("rv:comments", ${JSON.stringify(JSON.stringify(comments))});
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
