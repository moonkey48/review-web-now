// dist/ 를 로컬에서 정적 서빙한다 (의존성 0, Node 내장 http).
// 용도: 설치/튜토리얼 페이지(dist/index.html) 미리보기.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(root, "dist");
const PORT = Number(process.env.PORT) || 4178;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = normalize(join(DIST, pathname));
    if (!file.startsWith(DIST)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`
  Reviewer 설치/튜토리얼 페이지가 떴습니다:

  →  http://127.0.0.1:${PORT}/

  이 페이지를 열고 "📌 코멘트 남기기"를 북마크바로 드래그하세요.
  (종료: Ctrl+C)
`);
});
