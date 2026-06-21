// 브라우저에서만 검증 가능한 anchor.ts/react-source.ts 런타임 동작을 위한 자가완결 HTML 하니스 생성.
// 크래프트된 DOM에 대해 buildAnchor/buildSelector/reactSource를 돌려 H1~H5 + 소스추출을 단언한다.
// 결과는 window.__RV_TEST__ (그리고 #out)에 JSON으로 남긴다.
import esbuild from "esbuild";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(tmpdir(), "rv-anchor-test");
await mkdir(out, { recursive: true });

const entry = `
import { buildAnchor, buildSelector, pickElement } from ${JSON.stringify(join(root, "widget/anchor.ts"))};
import { reactSource } from ${JSON.stringify(join(root, "widget/react-source.ts"))};
globalThis.RV = { buildAnchor, buildSelector, pickElement, reactSource };
`;
const entryPath = join(out, "entry.ts");
await writeFile(entryPath, entry, "utf8");

const res = await esbuild.build({
  entryPoints: [entryPath],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2019",
  write: false,
  logLevel: "error",
});
const bundle = res.outputFiles[0].text;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  #hidden-h{display:none}
  #card{padding:24px;width:320px}
  #icon-btn{width:32px;height:32px}
</style></head><body>
<main>
  <h2 id="vis-h">결제 섹션</h2>
  <h2 id="hidden-h">숨은 데스크톱 배너 제목</h2>
  <div id="card" data-source="src/queue-item.tsx:31">
    <img id="thumb" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="썸네일">
    <div><span id="card-text">샤워기를 들고 찍은 ugc 이미지</span></div>
  </div>
  <button id="base-ui-_r_3_">결제하기</button>
  <button id="icon-btn"><svg viewBox="0 0 16 16"><path d="M1 1h14v14H1z"/></svg></button>
  <button id="icon-named" aria-label="닫기"><svg viewBox="0 0 16 16"><path id="icon-path" d="M1 1h14v14H1z"/></svg></button>
  <div id="mui-1234">설정</div>
  <input id="search" placeholder="프롬프트 검색…">
</main>
<pre id="out">running…</pre>
<script>${bundle}</script>
<script>
(function(){
  var R = [];
  var ok = function(name, cond, got){ R.push({name:name, pass:!!cond, got:got}); };
  function centerOf(el){ var r = el.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }

  // H3 — 프레임워크 자동 id를 셀렉터로 쓰지 않음
  var bu = document.getElementById("base-ui-_r_3_");
  var buSel = RV.buildSelector(bu);
  ok("H3 base-ui id 미사용", buSel.indexOf("base-ui") === -1, buSel);
  var mui = document.getElementById("mui-1234");
  var muiSel = RV.buildSelector(mui);
  ok("H3 mui id 미사용", muiSel.indexOf("mui-1234") === -1, muiSel);

  // H2 — 카드 래퍼 클릭 → OWN 텍스트(자식 span)만, 배너/섹션/alt 연결 X
  var span = document.getElementById("card-text");
  var sc = centerOf(span);
  var card = document.getElementById("card");
  var aCard = RV.buildAnchor(card, sc[0], sc[1]);
  ok("H2 OWN 텍스트만", aCard.quote && aCard.quote.exact === "샤워기를 들고 찍은 ugc 이미지", aCard.quote && aCard.quote.exact);
  ok("H2 섹션 연결 안됨", !(aCard.quote && aCard.quote.exact.indexOf("결제") !== -1), aCard.quote && aCard.quote.exact);

  // H1 — 가장 가까운 '보이는' heading만(숨은 배너 제외)
  ok("H1 보이는 heading", aCard.heading === "결제 섹션", aCard.heading);
  ok("H1 숨은 heading 제외", aCard.heading !== "숨은 데스크톱 배너 제목", aCard.heading);

  // H4 — 뷰포트 기록
  ok("H4 vw 기록", typeof aCard.vw === "number" && aCard.vw > 0, aCard.vw);
  ok("H4 vh 기록", typeof aCard.vh === "number" && aCard.vh > 0, aCard.vh);

  // ① 소스 포인터 — data-source 속성 파싱(조상에서)
  ok("소스 file 파싱", aCard.source && aCard.source.file === "src/queue-item.tsx", aCard.source && aCard.source.file);
  ok("소스 line 파싱", aCard.source && aCard.source.line === 31, aCard.source && aCard.source.line);

  // H5 — 텍스트·이름 없는 아이콘 버튼 → needsShot
  var icon = document.getElementById("icon-btn");
  var ic = centerOf(icon);
  var aIcon = RV.buildAnchor(icon, ic[0], ic[1]);
  ok("H5 빈 요소 needsShot", aIcon.needsShot === true, JSON.stringify({q:aIcon.quote, name:aIcon.a11y && aIcon.a11y.name, needsShot:aIcon.needsShot}));

  // 아이콘 내부(path/svg) 클릭 → 실제 interactive ancestor(button)로 승격
  var named = document.getElementById("icon-named");
  var nc = centerOf(named);
  var picked = RV.pickElement(nc[0], nc[1]);
  var aNamed = RV.buildAnchor(picked, nc[0], nc[1]);
  ok("interactive ancestor 승격", picked && picked.id === "icon-named", picked && picked.id);
  ok("승격 후 a11y 이름", aNamed.a11y && aNamed.a11y.role === "button" && aNamed.a11y.name === "닫기", JSON.stringify(aNamed.a11y));

  // 입력 placeholder를 인용으로
  var inp = document.getElementById("search");
  var pc = centerOf(inp);
  var aInp = RV.buildAnchor(inp, pc[0], pc[1]);
  ok("input placeholder 인용", aInp.quote && aInp.quote.exact === "프롬프트 검색…", aInp.quote && aInp.quote.exact);

  // 소스가 없는(React 아님) 환경에서도 throw 없이 동작 — buildAnchor가 끝까지 왔으면 통과
  ok("non-React reactSource 안전", true, "ok");

  var passed = R.filter(function(x){return x.pass;}).length;
  var result = { passed: passed, total: R.length, fails: R.filter(function(x){return !x.pass;}) };
  window.__RV_TEST__ = result;
  document.getElementById("out").textContent = JSON.stringify(result, null, 2);
})();
</script>
</body></html>`;

const htmlPath = join(out, "anchor-test.html");
await writeFile(htmlPath, html, "utf8");
console.log(htmlPath);
