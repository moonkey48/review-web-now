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
import { parseReviewInvite } from ${JSON.stringify(join(root, "widget/reviewGate.ts"))};
export { store, buildMarkdown, parseReviewInvite };
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

const { store, buildMarkdown, parseReviewInvite } = await import(
  bundlePath + "?t=" + process.hrtime.bigint()
);

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

ok(parseReviewInvite("https://x.test/") === null, "review 쿼리 없으면 초대 아님");
ok(
  parseReviewInvite("https://x.test/?review=%ED%99%8D%EA%B8%B8%EB%8F%99").name ===
    "홍길동",
  "review 쿼리 값을 이름으로 디코딩",
);
ok(
  parseReviewInvite("https://x.test/?review=%20%EB%AF%BC%EC%88%98%20").name ===
    "민수",
  "review 이름 앞뒤 공백 정리",
);

store.setName("테스터");
ok(store.getName() === "테스터", "이름 저장/조회");

const c1 = store.create({
  pagePath: "/pricing",
  pageUrl: "http://x/pricing",
  body: "결제 버튼 색이 비활성처럼 보여요",
  authorName: "테스터",
  anchor: {
    type: "pin",
    selector: "#checkout-btn",
    xPercent: 50,
    yPercent: 50,
    quote: { exact: "결제 버튼 영역 텍스트", prefix: "여기 ", suffix: " 영역" },
    a11y: { role: "button", name: "결제하기" },
    heading: "결제 안내",
    deepLink: "https://x/pricing#:~:text=%EA%B2%B0%EC%A0%9C",
  },
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
  anchor: {
    type: "pin",
    selector: ".hero h1",
    xPercent: 10,
    yPercent: 90,
    quote: { exact: "홈 히어로 제목" },
    a11y: { role: "heading" },
  },
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

store.setShot(c1.id, { id: c1.id, w: 400, h: 200 });
const c1s = store.listAll().find((c) => c.id === c1.id);
ok(c1s.shot && c1s.shot.id === c1.id, "setShot: 스크린샷 메타 첨부");

const gen = new Date("2026-06-14T01:30:00Z"); // KST 10:30
const mdAll = buildMarkdown("데모 사이트", store.listAll(), { status: "all", generatedAt: gen });
ok(mdAll.includes("# 리뷰 리포트 — 데모 사이트"), "MD 제목");
ok(/총 3개 \(미해결 2\)/.test(mdAll), "MD 총계/미해결 카운트");
ok(mdAll.indexOf("## /home") < mdAll.indexOf("## /pricing"), "MD 페이지 경로 오름차순");
ok(mdAll.includes("[x]") && mdAll.includes("[ ]"), "MD 체크박스 상태");
ok(mdAll.includes("핀: `#checkout-btn`"), "MD 핀 셀렉터 라벨");
ok(mdAll.includes("페이지 코멘트"), "MD 페이지 코멘트 라벨");
ok(mdAll.includes("10:30 (KST)"), "MD 생성 시각 KST");
ok(mdAll.includes("   둘째 줄도 있음"), "MD 다중행 본문 들여쓰기 포함");
ok(!mdAll.includes("### "), "MD 코멘트별 제목 없음");
ok(mdAll.includes("위치: `/pricing`"), "MD 코멘트별 경로 포함");
ok(mdAll.includes("위치: `/home`"), "MD 코멘트별 경로 포함(다른 페이지)");
ok(mdAll.includes("섹션: 결제 안내"), "MD 섹션(heading) 라인");
ok(mdAll.includes('요소(역할/이름): `button` / "결제하기"'), "MD 요소 역할/이름 라인");
ok(mdAll.includes("인용: …여기 **[결제 버튼 영역 텍스트]** 영역…"), "MD 인용 exact+앞뒤맥락 라인(trim)");
ok(mdAll.includes('인용: "홈 히어로 제목"'), "MD 인용 fallback(맥락 없을 때 따옴표)");
ok(mdAll.includes("요소(역할/이름): `heading`"), "MD 요소 역할만 있는 경우");
ok(
  mdAll.includes("딥링크: [위치 열기](https://x/pricing#:~:text="),
  "MD 딥링크 라인",
);
ok(mdAll.includes(`스크린샷: ![#`) && mdAll.includes(`images/${c1.id}.png`), "MD 스크린샷 상대경로 참조");
ok(mdAll.includes("우선순위 순으로"), "MD 상단 해석 가이드(우선순위)");

const mdOpen = buildMarkdown("데모 사이트", store.listAll(), { status: "open" });
ok(!mdOpen.includes("[x]"), "open 필터: 해결됨 제외");
ok(mdOpen.includes("미해결만 표시"), "open 필터 표기");

// 마크다운 인젝션 방지 — 페이지/사용자 파생 텍스트가 링크·이미지로 해석되지 않아야 한다.
const inj = buildMarkdown(
  "x",
  [
    {
      id: "i1",
      pagePath: "/p",
      pageUrl: "http://x/p",
      anchor: {
        type: "pin",
        selector: "#z",
        xPercent: 0,
        yPercent: 0,
        quote: { exact: "click ](http://evil)" },
        a11y: { role: "button", name: "x[y](z)" },
        heading: "a]b!",
        deepLink: "http://x/a(b)?r=(1)#:~:text=q",
      },
      body: "본문",
      authorName: "t",
      resolved: false,
      resolvedAt: null,
      createdAt: "2026-06-17T00:00:00Z",
      updatedAt: "2026-06-17T00:00:00Z",
    },
  ],
  { status: "all", generatedAt: gen },
);
ok(!inj.includes("](http://evil)"), "MD 인젝션: 인용 안의 ](url) 비활성화");
ok(inj.includes("click \\]\\(http://evil\\)"), "MD 인젝션: exact 메타문자 백슬래시 이스케이프");
ok(!inj.includes("[y](z)"), "MD 인젝션: a11y name 링크 비활성화");
ok(inj.includes("섹션: a\\]b\\!"), "MD 인젝션: heading 이스케이프");
ok(!inj.includes("a(b)?r=(1)") && inj.includes("a%28b%29"), "MD 인젝션: 딥링크 URL 괄호 인코딩");

// v0.4.3 — 소스 포인터 / 뷰포트 / unique 힌트 / needsShot 라인 + 우선순위 순서
const md043 = buildMarkdown(
  "x",
  [
    {
      id: "s1",
      pagePath: "/studio",
      pageUrl: "http://x/studio",
      anchor: {
        type: "pin",
        selector: "button:nth-of-type(2)",
        xPercent: 0,
        yPercent: 0,
        source: { component: "QueueItem", file: "src/queue-item.tsx", line: 31 },
        quote: { exact: "샤워기를 들고 찍은 ugc 이미지", unique: true },
        a11y: { role: "button", name: "큐 항목" },
        vw: 1440,
        vh: 900,
      },
      body: "큐 카드 크게",
      authorName: "테스터",
      shot: null,
      resolved: false,
      resolvedAt: null,
      createdAt: "2026-06-18T00:00:00Z",
      updatedAt: "2026-06-18T00:00:00Z",
    },
    {
      id: "s2",
      pagePath: "/studio",
      pageUrl: "http://x/studio",
      anchor: {
        type: "pin",
        selector: "div:nth-of-type(3)",
        xPercent: 0,
        yPercent: 0,
        quote: { exact: "검색", unique: false },
        vw: 390,
        vh: 844,
        needsShot: true,
      },
      body: "미리보기 너무 넓어",
      authorName: "테스터",
      shot: null,
      resolved: false,
      resolvedAt: null,
      createdAt: "2026-06-18T00:01:00Z",
      updatedAt: "2026-06-18T00:01:00Z",
    },
  ],
  { status: "all", generatedAt: gen },
);
ok(md043.includes("소스: `QueueItem` · src/queue-item.tsx:31"), "MD 소스 포인터(컴포넌트·file:line)");
ok(md043.includes('인용: "샤워기를 들고 찍은 ugc 이미지" · grep 1줄 기대'), "MD unique=true grep 힌트");
ok(md043.includes('인용: "검색" · 중복 — 맥락/셀렉터 확인'), "MD unique=false 중복 힌트");
ok(md043.includes("뷰포트: 1440×900"), "MD 뷰포트 폭×높이(데스크톱)");
ok(md043.includes("뷰포트: 390×844"), "MD 뷰포트(모바일)");
ok(md043.includes("⚠ 빈 요소 — 스크린샷 권장"), "MD needsShot 라인");
ok(
  md043.indexOf("소스: `QueueItem`") < md043.indexOf('인용: "샤워기'),
  "MD 우선순위: 소스가 인용보다 먼저",
);
ok(
  md043.indexOf('인용: "샤워기') < md043.indexOf("위치: `/studio`"),
  "MD 우선순위: 인용이 셀렉터보다 먼저",
);

store.remove(c3.id);
ok(store.listAll().length === 2, "remove 동작");
store.clear();
ok(store.listAll().length === 0, "clear 동작");

// ── 버전 관리 ─────────────────────────────────────────────────
// clear()가 버전 키도 리셋했는지(확장된 clear)
ok(store.getVersion() === "v0", "clear 후 현재 버전 = v0(SEED)");
ok(store.readVisibleRaw() === null, "clear 후 가시성 = 전체 센티넬(null)");
ok(store.getKnownVersions().length === 0, "clear 후 레지스트리 비어있음");

// create()가 현재 버전을 스탬프
const vc1 = store.create({ pagePath: "/v", pageUrl: "http://x/v", body: "b", authorName: "t", anchor: { type: "page" } });
ok(vc1.version === "v0", "create: 현재 버전(v0) 스탬프");

// 버전 bump → 새 코멘트 반영 + 레지스트리 등록
store.setVersion("0.0.1");
ok(store.getVersion() === "0.0.1", "setVersion 반영");
const vc2 = store.create({ pagePath: "/v", pageUrl: "http://x/v", body: "b2", authorName: "t", anchor: { type: "page" } });
ok(vc2.version === "0.0.1", "create: bump된 버전 스탬프");
ok(store.getKnownVersions().includes("0.0.1"), "레지스트리에 새 버전 등록");

// 가시성 persist + 센티넬 복원
store.setVisibleVersions(["0.0.1"]);
ok(JSON.stringify(store.readVisibleRaw()) === JSON.stringify(["0.0.1"]), "가시성 persist");
store.clearVisible();
ok(store.readVisibleRaw() === null, "clearVisible → 전체 센티넬 복원");

// nextVersion — 버튼 생성용 vN 자동 증가(레거시 라벨 무시)
ok(store.nextVersion([]) === "v1", "nextVersion([]) = v1");
ok(store.nextVersion(["v0"]) === "v1", "nextVersion([v0]) = v1(SEED 다음)");
ok(store.nextVersion(["v0", "v3", "draft"]) === "v4", "nextVersion: 최대 vN+1");
ok(store.nextVersion(["0.0.1", "release"]) === "v1", "nextVersion: 레거시 라벨 무시 → v1");

// 색 안정성 — 현재 버전 bump해도 다른 버전 색 불변(적대적 검증이 잡은 회귀)
store.clear();
store.setVersion("v0");
store.setVersion("v1");
store.setVersion("v2"); // 레지스트리 [v0,v1,v2], current=v2
const v1ColorBefore = store.colorFor("v1", "v2");
ok(store.colorFor("v2", "v2") === "#6366f1", "현재 버전 = 시그니처 인디고");
ok(v1ColorBefore !== "#6366f1" && v1ColorBefore.charAt(0) === "#", "비현재 버전 = 팔레트 색");
ok(store.colorFor("v1", "v0") === v1ColorBefore, "색 안정성: 현재 bump해도 v1 색 불변");
ok(store.colorFor("v0", "v0") === "#6366f1", "bump 후 새 현재(v0)=인디고");

// 마이그레이션 — 버전 없는 코멘트 → v0, 멱등
store.clear();
globalThis.localStorage.setItem("rv:comments", JSON.stringify([
  { id: "legacy1", pagePath: "/p", pageUrl: "http://x/p", anchor: { type: "page" }, body: "옛 코멘트", authorName: "t", resolved: false, resolvedAt: null, createdAt: "2026-06-17T00:00:00Z", updatedAt: "2026-06-17T00:00:00Z" },
]));
store.migrate();
ok(store.listAll()[0].version === "v0", "마이그레이션: 버전없음 → v0");
ok(globalThis.localStorage.getItem("rv:schema") === "1", "마이그레이션: 스키마 가드 기록");
const afterMigrate = JSON.stringify(store.listAll());
store.migrate(); // 멱등 — 가드 때문에 재스탬프 없음
ok(JSON.stringify(store.listAll()) === afterMigrate, "마이그레이션 멱등(재호출 무변)");

// MD 버전 줄(P1) + 인젝션 이스케이프
const mdVer = buildMarkdown("x", [
  { id: "mv", pagePath: "/p", pageUrl: "http://x/p", anchor: { type: "pin", selector: "#z", xPercent: 0, yPercent: 0 }, body: "본문", authorName: "t", version: "1.0](http://evil)", resolved: false, resolvedAt: null, createdAt: "2026-06-17T00:00:00Z", updatedAt: "2026-06-17T00:00:00Z" },
], { status: "all", generatedAt: gen });
ok(mdVer.includes("- 버전: `1.0\\]\\(http://evil\\)`"), "MD 버전 줄 + 인젝션 이스케이프");
store.clear();

console.log(`\n=== selftest: ${pass} passed, ${fail} failed ===`);
if (fail === 0) {
  console.log("\n--- 샘플 MD (status=all) ---\n" + mdAll);
}
process.exit(fail ? 1 : 0);
