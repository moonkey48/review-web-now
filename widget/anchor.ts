import type { A11yLocator, Anchor, TextQuote } from "./types";
import { reactSource } from "./react-source";

export const HOST_ID = "reviewer-widget-host";

function cssEscape(s: string): string {
  return typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape(s)
    : s.replace(/([^\w-])/g, "\\$1");
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// 프레임워크가 런타임에 생성한 id 패턴 — 안정 셀렉터로 절대 쓰면 안 됨(매 렌더/빌드마다 바뀜).
// React useId는 세대마다 구분자가 바뀜: ':r0:'(18/19.0) · '«r0»'(19.1) · '_r_0_'(19.2+).
// base-ui-_r_3_ 는 React 19.2 형식을 Base UI가 감싼 것. emotion css-<hash>, react-aria 등도 차단.
const GENERATED_ID_RE =
  /(^|[-_:])(?::r[0-9a-z]+:|«r[0-9a-z]+»|_r_[0-9a-z]+_)|^(?:base-ui|mui|radix|react-aria|headlessui|reach|ariakit|chakra|mantine|nextui|heroui|rc)[-_]|^(?:css|sc)-[0-9a-z]{5,}$|:/i;

// id(또는 aria-label 값)가 작성자가 직접 단 안정값인지, 런타임 생성값인지 판별.
function isGeneratedId(id: string | null | undefined): boolean {
  if (!id) return true;
  const v = id.trim();
  if (!v) return true;
  if (GENERATED_ID_RE.test(v)) return true; // useId 구분자·라이브러리 프리픽스·emotion·날콜론(:)
  if (v.length >= 40) return true; // 비정상적으로 긴 id → 해시/직렬화
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return true; // uuid v4
  // 구분자(- _) 없는 12자+ 영문·숫자 혼합 한 덩어리 → 난수/해시 토큰
  if (!/[-_]/.test(v) && /^[a-z0-9]{12,}$/i.test(v) && /[0-9]/.test(v) && /[a-z]/i.test(v)) return true;
  return false;
}

function uniq(sel: string): boolean {
  try {
    return document.querySelectorAll(sel).length === 1;
  } catch {
    return false;
  }
}

// 가시성 술어(H1/H2 공용) — display:none / visibility:hidden / opacity:0 / [hidden] / 0크기(lg:hidden·offscreen).
// position:fixed/sticky 오판을 피하려 offsetParent는 쓰지 않는다. getClientRects로 접힘/클립을 포괄.
function isHidden(el: Element): boolean {
  const he = el as HTMLElement;
  if (he.hasAttribute?.("hidden")) return true;
  const cs = typeof getComputedStyle === "function" ? getComputedStyle(he) : null;
  if (cs) {
    if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") return true;
    if (parseFloat(cs.opacity) === 0) return true;
  }
  if (he.getClientRects && he.getClientRects().length === 0) return true;
  return false;
}

// 셀렉터 조각(H3). 우선순위: 작성자 안정 id(비생성·유일) > data-testid/test/qa/cy(유일)
//   > name/aria-label(비생성·유일) > 시맨틱 태그 > nth-of-type(최후수단).
// 프레임워크 자동 id(#base-ui-_r_*, :r*:, react-aria-* …)는 절대 종단 셀렉터로 쓰지 않는다.
function segment(node: Element): { value: string; terminal: boolean } {
  const id = node.id;
  if (id && !isGeneratedId(id)) {
    const sel = `#${cssEscape(id)}`;
    if (uniq(sel)) return { value: sel, terminal: true };
  }
  for (const attr of ["data-testid", "data-test", "data-qa", "data-cy"]) {
    const v = node.getAttribute(attr);
    if (v) {
      const sel = `[${attr}="${v.replace(/"/g, '\\"')}"]`;
      if (uniq(sel)) return { value: sel, terminal: true };
    }
  }
  const tag = node.tagName.toLowerCase();
  for (const attr of ["name", "aria-label"]) {
    const v = node.getAttribute(attr);
    if (v && v.trim() && !isGeneratedId(v)) {
      const sel = `${tag}[${attr}="${v.replace(/"/g, '\\"')}"]`;
      if (uniq(sel)) return { value: sel, terminal: true };
      if (attr === "name") return { value: sel, terminal: false }; // 유일하지 않아도 경로를 좁힘
    }
  }
  const parent = node.parentElement;
  if (!parent) return { value: tag, terminal: false };
  const same = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
  if (same.length === 1) return { value: tag, terminal: false };
  return { value: `${tag}:nth-of-type(${same.indexOf(node) + 1})`, terminal: false };
}

export function buildSelector(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body && node !== document.documentElement) {
    const s = segment(node);
    parts.unshift(s.value);
    if (s.terminal || parts.length >= 14) break;
    node = node.parentElement;
  }
  const selector = parts.length ? parts.join(" > ") : "body";
  try {
    if (document.querySelector(selector) === el) return selector;
  } catch {
    // 아래 풀 경로로 폴백
  }
  // 유일하지 않으면 body부터 nth-of-type 풀 경로
  const full: string[] = [];
  node = el;
  while (node && node !== document.documentElement) {
    if (node === document.body) {
      full.unshift("body");
      break;
    }
    const tag = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    const same = parent
      ? Array.from(parent.children).filter((c) => c.tagName === node!.tagName)
      : [node];
    full.unshift(
      same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(node) + 1})` : tag,
    );
    node = parent;
  }
  return full.join(" > ") || "body";
}

// 공백을 한 칸으로 정리하고 max자에서 자른다(비면 undefined).
function cleanText(s: string | null | undefined, max: number): string | undefined {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (!t) return undefined;
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

// 보이는 heading만 섹션 후보로 인정(H1). 숨은(lg:hidden·display:none·aria-hidden) heading은 스킵 —
// 데스크톱 전용 숨은 배너 heading이 모든 핀의 섹션으로 잘못 붙는 버그를 막는다.
function visibleHeading(n: Element | null | undefined): boolean {
  return (
    !!n &&
    /^H[1-6]$/.test(n.tagName) &&
    !isHidden(n) &&
    !n.closest('[aria-hidden="true"]')
  );
}

// 핀 요소에서 가장 가까운 '보이는' heading: 조상들을 타고 올라가며 앞선 형제 중 h1~h6를 찾는다.
function nearestHeading(el: Element): string | undefined {
  let node: Element | null = el;
  while (node && node !== document.body) {
    if (visibleHeading(node)) return cleanText(node.textContent, 90);
    let prev: Element | null = node.previousElementSibling;
    while (prev) {
      if (visibleHeading(prev)) return cleanText(prev.textContent, 90);
      // 형제 서브트리 안에서는 핀에 더 가까운(뒤쪽) '보이는' heading을 고른다.
      const inner = prev.querySelectorAll?.("h1,h2,h3,h4,h5,h6");
      if (inner) {
        for (let i = inner.length - 1; i >= 0; i--) {
          if (visibleHeading(inner[i])) return cleanText(inner[i].textContent, 90);
        }
      }
      prev = prev.previousElementSibling;
    }
    node = node.parentElement;
  }
  return undefined;
}

// ── ① TextQuoteSelector: exact + 앞뒤 맥락 (순수 DOM, 의존성 0) ──
function collapse(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Range로 요소 직전/직후 텍스트를 긁어 ±len자 맥락을 만든다(같은 문구 반복 시 모호성 해소).
function contextAround(el: Element, len: number): { prefix?: string; suffix?: string } {
  // el 자신은 제외하고 조상에서만 컨테이너를 찾는다(el이 section/article 자체면 Range 경계가 역전됨).
  const root = el.parentElement?.closest("main, article, section") || document.body;
  if (root === el || !root.contains(el)) return {};
  try {
    const pre = document.createRange();
    pre.setStart(root, 0);
    pre.setEndBefore(el);
    const post = document.createRange();
    post.setStartAfter(el);
    post.setEnd(root, root.childNodes.length);
    const prefix = collapse(pre.toString()).slice(-len);
    const suffix = collapse(post.toString()).slice(0, len);
    return { prefix: prefix || undefined, suffix: suffix || undefined };
  } catch {
    return {};
  }
}

// 한 문장/라벨 한도. 160은 컴포넌트가 뒤섞여 너무 김 → 80으로 낮춰 grep 가성비를 높인다.
const QUOTE_MAX = 80;
const QUOTE_MIN = 4; // 이보다 짧으면 유일성 판별 안 함(거의 항상 비유일)

// 요소의 '자기 텍스트' — 직속 Text 노드만. 서브트리(자식 컴포넌트)는 제외해
// 배너+헤더+카드가 이어붙는 노이즈를 막는다. (el.textContent는 서브트리 전체라 금지)
function ownText(el: Element): string {
  let s = "";
  const kids = el.childNodes;
  for (let i = 0; i < kids.length; i++) {
    if (kids[i].nodeType === 3) s += kids[i].textContent || "";
  }
  return collapse(s);
}

// 클릭 요소가 '자기 텍스트' 없는 래퍼면, 클릭 지점/최소 면적 기준으로 실제 클릭한 텍스트 leaf를 다시 잡는다.
// 보이는 자손만 BFS(숨은 것 스킵), 노드 2000개 상한(임의 거대 컨테이너 안전).
function narrowToOwnText(el: Element, x: number, y: number): Element {
  if (ownText(el)) return el;
  const queue: Element[] = Array.from(el.children);
  let visited = 0;
  let hit: { el: Element; a: number } | null = null;
  let any: { el: Element; a: number } | null = null;
  while (queue.length && visited++ < 2000) {
    const n = queue.shift()!;
    if (isHidden(n)) continue;
    if (ownText(n)) {
      const r = n.getBoundingClientRect();
      const a = Math.max(0, r.width) * Math.max(0, r.height);
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        if (!hit || a < hit.a) hit = { el: n, a };
      } else if (!any || a < any.a) {
        any = { el: n, a };
      }
    }
    const ch = n.children;
    for (let i = 0; i < ch.length; i++) queue.push(ch[i]);
  }
  return (hit || any)?.el || el;
}

// 입력/이미지는 서브트리 텍스트 대신 placeholder/alt를 인용 텍스트로 쓴다.
function quoteTextOf(t: Element): string {
  const tag = t.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return collapse(t.getAttribute("placeholder") || "");
  if (tag === "img") return collapse(t.getAttribute("alt") || "");
  return ownText(t);
}

// 섹션(가장 가까운 main/article/section) 안에서 needle이 유일한지 — bounded indexOf 스캔(reflow 없음).
// 1회면 true(grep 1줄 기대), 2회 이상이면 false. 0회(placeholder/alt 등 textContent에 없음)·짧음은 undefined.
function isUniqueInSection(el: Element, needle: string): boolean | undefined {
  if (!needle || needle.length < QUOTE_MIN) return undefined;
  const root = el.parentElement?.closest("main, article, section") || document.body;
  let text: string;
  try {
    text = collapse(root.textContent || "");
  } catch {
    return undefined;
  }
  let i = 0;
  let c = 0;
  while ((i = text.indexOf(needle, i)) !== -1 && c < 2) {
    c++;
    i += needle.length;
  }
  return c === 0 ? undefined : c === 1;
}

function textQuote(el: Element, clientX: number, clientY: number): TextQuote | undefined {
  const t = narrowToOwnText(el, clientX, clientY);
  const raw = quoteTextOf(t);
  if (!raw) return undefined; // 텍스트 없음 → a11y/needsShot에 위임(H5)
  const unique = isUniqueInSection(t, raw);
  const exact = raw.length > QUOTE_MAX ? raw.slice(0, QUOTE_MAX - 1) + "…" : raw;
  const { prefix, suffix } = contextAround(t, 32);
  return { exact, prefix, suffix, unique };
}

// ── ② 역할 + 접근가능한 이름 (AccName 완전판이 아닌 90% 미니 구현) ──
function roleOf(el: Element): string | undefined {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit.trim().split(/\s+/)[0];
  const tag = el.tagName.toLowerCase();
  if (tag === "a") return (el as HTMLAnchorElement).getAttribute("href") != null ? "link" : undefined;
  if (tag === "input") {
    const t = ((el as HTMLInputElement).type || "text").toLowerCase();
    if (t === "checkbox") return "checkbox";
    if (t === "radio") return "radio";
    if (t === "button" || t === "submit" || t === "reset" || t === "image") return "button";
    if (t === "search") return "searchbox";
    if (t === "range") return "slider";
    return "textbox";
  }
  const map: Record<string, string> = {
    button: "button", h1: "heading", h2: "heading", h3: "heading", h4: "heading",
    h5: "heading", h6: "heading", img: "img", nav: "navigation", main: "main",
    select: "combobox", textarea: "textbox", table: "table", ul: "list", ol: "list",
    li: "listitem", form: "form", dialog: "dialog", figure: "figure",
  };
  return map[tag];
}

// 자손 텍스트로 이름을 만들지 않는 컨테이너 역할(AccName 스펙: name from content 비대상).
const NO_CONTENT_NAME = new Set([
  "navigation", "main", "list", "table", "form", "dialog", "region", "figure",
  "banner", "contentinfo", "complementary", "search", "grid", "tablist",
  "menu", "listbox", "tree", "group", "article",
]);

function accName(el: Element, role: string | undefined): string | undefined {
  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    const txt = labelledby
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent || "")
      .join(" ");
    const c = cleanText(txt, 120);
    if (c) return c;
  }
  const aria = el.getAttribute("aria-label");
  // useId 등 런타임 생성 토큰이 aria-label로 새는 경우는 이름으로 쓰지 않는다.
  if (aria && aria.trim() && !isGeneratedId(aria)) return cleanText(aria, 120);
  const tag = el.tagName.toLowerCase();
  // 이미지 / 이미지 버튼(input[type=image]): alt가 1순위 이름
  if (tag === "img" || (tag === "input" && (el as HTMLInputElement).type === "image")) {
    const alt = el.getAttribute("alt");
    if (alt != null) return cleanText(alt, 120) || undefined; // alt="" → 장식용(이름 없음)
  }
  if (tag === "input" || tag === "textarea" || tag === "select") {
    const id = el.id;
    if (id) {
      const lab = document.querySelector(`label[for="${cssEscape(id)}"]`);
      const c = cleanText(lab?.textContent, 120);
      if (c) return c;
    }
    const ph = (el as HTMLInputElement).getAttribute("placeholder");
    if (ph && ph.trim()) return cleanText(ph, 120);
  }
  // 컨테이너 역할이면 자손 텍스트를 이름으로 쓰지 않는다(nav 전체 링크가 합쳐지는 것 방지).
  if (!(role && NO_CONTENT_NAME.has(role))) {
    const tc = cleanText(el.textContent, 120);
    if (tc) return tc;
  }
  const title = el.getAttribute("title");
  if (title && title.trim()) return cleanText(title, 120);
  return undefined;
}

function a11yOf(el: Element): A11yLocator | undefined {
  const role = roleOf(el);
  const name = accName(el, role);
  if (!role && !name) return undefined;
  return { role, name };
}

// ── ④ Text Fragment 딥링크 (#:~:text=) — URL 문자열 조립, 의존성 0 ──
function textFragmentLink(href: string, exact: string): string | undefined {
  // cleanText가 붙인 말줄임(…)은 페이지에 없는 문자라 fragment 매칭을 깨뜨린다 → 제거.
  const t = collapse(exact).replace(/…+$/, "").trim();
  if (t.length < 4) return undefined;
  const base = href.split("#")[0];
  // '-'는 prefix/suffix 구분자라 반드시 인코딩. start,end의 ','만 구조적 구분자로 남긴다.
  const enc = (s: string) => encodeURIComponent(s).replace(/-/g, "%2D");
  const directive =
    t.length <= 60
      ? enc(t)
      : `${enc(t.slice(0, 30).trim())},${enc(t.slice(-30).trim())}`;
  return `${base}#:~:text=${directive}`;
}

export function buildAnchor(el: Element, clientX: number, clientY: number): Anchor {
  const rect = el.getBoundingClientRect();
  const xPercent = rect.width ? clamp(((clientX - rect.left) / rect.width) * 100, 0, 100) : 50;
  const yPercent = rect.height ? clamp(((clientY - rect.top) / rect.height) * 100, 0, 100) : 50;
  const quote = textQuote(el, clientX, clientY);
  const a11y = a11yOf(el);
  // H5: 텍스트도 접근가능한 이름도 없는 '빈 요소'(아이콘 전용 등)는 스크린샷이 사실상 유일한 단서.
  const needsShot = !quote && !(a11y && a11y.name);
  return {
    type: "pin",
    selector: buildSelector(el),
    xPercent: Math.round(xPercent * 100) / 100,
    yPercent: Math.round(yPercent * 100) / 100,
    source: reactSource(el), // ① 소스 포인터 — best-effort, 절대 셀렉터엔 안 씀
    quote,
    a11y,
    heading: nearestHeading(el),
    deepLink: quote ? textFragmentLink(location.href, quote.exact) : undefined,
    vw: window.innerWidth, // H4 — 캡처 뷰포트(lg: 분기 판별)
    vh: window.innerHeight,
    needsShot: needsShot || undefined, // false면 직렬화에서 제외(payload 절약)
  };
}

// 셀렉터를 다시 찾아 뷰포트 좌표를 계산. 요소가 사라졌으면 null(위치 유실).
export function resolveAnchor(anchor: Anchor): { x: number; y: number } | null {
  if (anchor.type !== "pin") return null;
  let el: Element | null = null;
  try {
    el = document.querySelector(anchor.selector);
  } catch {
    return null;
  }
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return {
    x: rect.left + (rect.width * anchor.xPercent) / 100,
    y: rect.top + (rect.height * anchor.yPercent) / 100,
  };
}

export function scrollToAnchor(anchor: Anchor | null) {
  if (!anchor || anchor.type !== "pin") return;
  try {
    document
      .querySelector(anchor.selector)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  } catch {
    // 셀렉터 오류 무시
  }
}

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "label",
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="menuitem"]',
  '[role="option"]',
].join(",");

function interactiveTarget(el: Element): Element {
  if (el.matches(INTERACTIVE_SELECTOR)) return el;
  const closest = el.closest(INTERACTIVE_SELECTOR);
  return closest || el;
}

// 위젯 자신(host)을 잠시 클릭 투과시키고 그 아래의 페이지 요소를 집는다
export function pickElement(x: number, y: number): Element | null {
  const host = document.getElementById(HOST_ID);
  const prev = host ? host.style.pointerEvents : "";
  if (host) host.style.pointerEvents = "none";
  let el: Element | null = null;
  try {
    el = document.elementFromPoint(x, y);
  } finally {
    if (host) host.style.pointerEvents = prev;
  }
  if (!el || el === document.documentElement) return null;
  return interactiveTarget(el);
}
