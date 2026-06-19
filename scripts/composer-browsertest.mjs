// Composer 포커스 + ⌘/Ctrl+Enter(스크린샷 체크 상태) e2e 검증용 자가완결 HTML 생성.
// 빌드된 dist/widget.js를 인라인하고 __RV_FORCE__로 강제 마운트한다.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const widget = await readFile(join(root, "dist/widget.js"), "utf8");
const out = join(tmpdir(), "rv-composer-test");
await mkdir(out, { recursive: true });

const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>window.__RV_FORCE__ = 1;</script>
<main style="padding:60px">
  <h1 id="target" style="font-size:24px">리뷰 대상 제목 텍스트</h1>
  <p style="margin-top:20px">본문 단락 — 클릭 대상.</p>
</main>
<script>${widget}</script>
</body></html>`;

const p = join(out, "composer-test.html");
await writeFile(p, html, "utf8");
console.log(p);
