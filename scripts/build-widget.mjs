import esbuild from "esbuild";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(root, "dist");
const watch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: [join(root, "widget/index.tsx")],
  outfile: join(DIST, "widget.js"), // write:false라 실제로 쓰진 않지만 출력 경로를 고정
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2019",
  jsx: "automatic",
  jsxImportSource: "preact",
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  legalComments: "none",
  define: { "process.env.NODE_ENV": watch ? '"development"' : '"production"' },
  write: false, // 메모리로 받아 산출물 3종을 직접 쓴다
  logLevel: "silent",
};

const kb = (bytes) => (bytes / 1024).toFixed(1);

function escapeAttr(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const SKILL_DIR = join(root, ".claude/skills/reviewer-install");

// 번들(IIFE 문자열) → dist/{widget.js, bookmarklet.txt, index.html}
async function emit(code) {
  await mkdir(DIST, { recursive: true });

  // 1) 정적 스크립트 (데모/스크립트태그용)
  await writeFile(join(DIST, "widget.js"), code, "utf8");

  // 1-b) 설치 스킬에도 최신 위젯 동봉 (스킬이 자체 포함되도록)
  try {
    await mkdir(SKILL_DIR, { recursive: true });
    await writeFile(join(SKILL_DIR, "widget.js"), code, "utf8");
  } catch {
    /* 스킬 폴더가 없거나 쓰기 불가하면 무시 */
  }

  // 2) 자기완결형 북마클릿: __RV_FORCE__로 노출 게이트를 건너뛴 뒤 번들 실행.
  //    바깥 함수의 첫 문장을 "use strict"로 둬서 번들의 strict 모드를 유지한다.
  const payload =
    '(function(){"use strict";window.__RV_FORCE__=1;' + code + "})();";
  const bookmarklet = "javascript:" + encodeURIComponent(payload) + "void%200";
  await writeFile(join(DIST, "bookmarklet.txt"), bookmarklet, "utf8");

  // 3) 랜딩/데모 페이지 (북마클릿 href·크기 주입)
  const tpl = await readFile(join(root, "templates/index.html"), "utf8");
  const html = tpl
    .replaceAll("__BOOKMARKLET__", escapeAttr(bookmarklet))
    .replaceAll("__SIZE_KB__", kb(code.length))
    .replaceAll("__BMK_KB__", kb(bookmarklet.length));
  await writeFile(join(DIST, "index.html"), html, "utf8");

  const warn = bookmarklet.length > 65536 ? "  ⚠ 북마클릿이 큼(Safari 주의)" : "";
  console.log(
    `[reviewer] widget.js ${kb(code.length)}KB · bookmarklet ${kb(
      bookmarklet.length,
    )}KB → dist/${warn}`,
  );
}

function pickCode(result) {
  const f = result.outputFiles?.find((o) => o.path.endsWith(".js"));
  return f ? f.text : null;
}

if (watch) {
  const ctx = await esbuild.context({
    ...options,
    plugins: [
      {
        name: "reviewer-emit",
        setup(build) {
          build.onEnd(async (result) => {
            if (result.errors.length) {
              console.error("[reviewer] build error");
              return;
            }
            const code = pickCode(result);
            if (code) await emit(code).catch((e) => console.error(e));
          });
        },
      },
    ],
  });
  await ctx.watch();
  console.log("[reviewer] watching widget/ …");
} else {
  const result = await esbuild.build(options);
  const code = pickCode(result);
  if (!code) {
    console.error("[reviewer] no output produced");
    process.exit(1);
  }
  await emit(code);
}
