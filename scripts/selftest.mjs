// store.ts + markdown.ts 의 동작을 Node에서 검증한다 (브라우저 없이).
// esbuild로 위젯 TS를 번들해 import하고, localStorage는 메모리 셰임으로 대체한다.
import esbuild from "esbuild";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tmp = join(tmpdir(), "rv-selftest");
await mkdir(tmp, { recursive: true });

const entry = `
import * as store from ${JSON.stringify(join(root, "widget/store.ts"))};
import { buildMarkdown } from ${JSON.stringify(join(root, "widget/markdown.ts"))};
export { store, buildMarkdown };
`;
const entryPath = join(tmp, "entry.ts");
await writeFile(entryPath, entry, "utf8");
const bundlePath = join(tmp, "bundle.mjs");
await esbuild.build({
  entryPoints: [entryPath],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2020",
  outfile: bundlePath,
  logLevel: "error",
});

// localStorage 셰임 (store는 함수 호출 시점에만 접근하므로 import 후 주입해도 안전)
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => void mem.set(k, String(v)),
  removeItem: (k) => void mem.delete(k),
  clear: () => mem.clear(),
};

const { store, buildMarkdown } = await import(bundlePath + "?t=" + process.hrtime.bigint());

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  if (cond) pass++;
  else {
    fail++;
    console.error("  ✗ " + msg);
  }
};

store.clear();
ok(store.listAll().length === 0, "초기 비어있음");
ok(store.getName() === "", "이름 기본 빈문자열");

store.setName("테스터");
ok(store.getName() === "테스터", "이름 저장/조회");

const c1 = store.create({
  pagePath: "/pricing",
  pageUrl: "http://x/pricing",
  body: "결제 버튼 색이 비활성처럼 보여요",
  authorName: "테스터",
  anchor: { type: "pin", selector: "#checkout-btn", xPercent: 50, yPercent: 50 },
});
ok(!!c1.id && !!c1.createdAt && c1.resolved === false, "create: id/ts/기본 미해결");

const c2 = store.create({
  pagePath: "/pricing",
  pageUrl: "http://x/pricing",
  body: "카피 오타\n둘째 줄도 있음",
  authorName: "테스터",
  anchor: { type: "page" },
});
const c3 = store.create({
  pagePath: "/home",
  pageUrl: "http://x/home",
  body: "홈 히어로 위치 확인",
  authorName: "민수",
  anchor: { type: "pin", selector: ".hero h1", xPercent: 10, yPercent: 90 },
});

ok(store.listAll().length === 3, "전체 3개");
ok(store.list("/pricing").length === 2, "/pricing 2개");
ok(store.list("/home").length === 1, "/home 1개");
ok(store.list("/pricing")[0].id === c1.id, "list는 작성순 정렬");

store.update(c2.id, { resolved: true });
const c2u = store.listAll().find((c) => c.id === c2.id);
ok(c2u.resolved === true && c2u.resolvedAt !== null, "resolve 토글 + resolvedAt 기록");

store.update(c1.id, { body: "수정된 본문" });
ok(store.listAll().find((c) => c.id === c1.id).body === "수정된 본문", "본문 수정");

const gen = new Date("2026-06-14T01:30:00Z"); // KST 10:30
const mdAll = buildMarkdown("데모 사이트", store.listAll(), { status: "all", generatedAt: gen });
ok(mdAll.includes("# 리뷰 리포트 — 데모 사이트"), "MD 제목");
ok(/총 3개 \(미해결 2\)/.test(mdAll), "MD 총계/미해결 카운트");
ok(mdAll.indexOf("## /home") < mdAll.indexOf("## /pricing"), "MD 페이지 경로 오름차순");
ok(mdAll.includes("[x]") && mdAll.includes("[ ]"), "MD 체크박스 상태");
ok(mdAll.includes("핀: `#checkout-btn`"), "MD 핀 셀렉터 라벨");
ok(mdAll.includes("페이지 코멘트"), "MD 페이지 코멘트 라벨");
ok(mdAll.includes("10:30 (KST)"), "MD 생성 시각 KST");
ok(mdAll.includes("> 둘째 줄도 있음"), "MD 다중행 본문 전문 포함");

const mdOpen = buildMarkdown("데모 사이트", store.listAll(), { status: "open" });
ok(!mdOpen.includes("[x]"), "open 필터: 해결됨 제외");
ok(mdOpen.includes("미해결만 표시"), "open 필터 표기");

store.remove(c3.id);
ok(store.listAll().length === 2, "remove 동작");
store.clear();
ok(store.listAll().length === 0, "clear 동작");

console.log(`\n=== selftest: ${pass} passed, ${fail} failed ===`);
if (fail === 0) {
  console.log("\n--- 샘플 MD (status=all) ---\n" + mdAll);
}
process.exit(fail ? 1 : 0);
