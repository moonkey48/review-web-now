import type { A11yLocator, Anchor, TextQuote } from "./types";

export const HOST_ID = "reviewer-widget-host";

function cssEscape(s: string): string {
  return typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape(s)
    : s.replace(/([^\w-])/g, "\\$1");
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// 요소 하나에 대한 셀렉터 조각. id / 유일한 data-testid를 만나면 거기서 경로를 끊는다.
function segment(node: Element): { value: string; terminal: boolean } {
  if (node.id) return { value: `#${cssEscape(node.id)}`, terminal: true };
  const testid = node.getAttribute("data-testid");
  if (testid) {
    const value = `[data-testid="${testid.replace(/"/g, '\\"')}"]`;
    try {
      if (document.querySelectorAll(value).length === 1) {
        return { value, terminal: true };
      }
    } catch {
      // 잘못된 문자가 섞인 testid는 무시
    }
  }
  const tag = node.tagName.toLowerCase();
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

// 핀 요소에서 가장 가까운 heading: 조상들을 타고 올라가며 앞선 형제 중 h1~h6를 찾는다.
function nearestHeading(el: Element): string | undefined {
  let node: Element | null = el;
  while (node && node !== document.body) {
    if (/^H[1-6]$/.test(node.tagName)) return cleanText(node.textContent, 90);
    let prev: Element | null = node.previousElementSibling;
    while (prev) {
      if (/^H[1-6]$/.test(prev.tagName)) return cleanText(prev.textContent, 90);
      // 형제 서브트리 안에서는 핀에 더 가까운 '마지막' heading을 고른다.
      const inner = prev.querySelectorAll?.("h1,h2,h3,h4,h5,h6");
      if (inner && inner.length) {
        return cleanText(inner[inner.length - 1].textContent, 90);
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

function textQuote(el: Element): TextQuote | undefined {
  const exact = cleanText(el.textContent, 160);
  if (!exact) return undefined;
  const { prefix, suffix } = contextAround(el, 32);
  return { exact, prefix, suffix };
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
  if (aria && aria.trim()) return cleanText(aria, 120);
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
  const quote = textQuote(el);
  return {
    type: "pin",
    selector: buildSelector(el),
    xPercent: Math.round(xPercent * 100) / 100,
    yPercent: Math.round(yPercent * 100) / 100,
    quote,
    a11y: a11yOf(el),
    heading: nearestHeading(el),
    deepLink: quote ? textFragmentLink(location.href, quote.exact) : undefined,
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
  return el;
}
