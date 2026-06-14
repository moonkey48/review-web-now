import type { Anchor } from "./types";

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

export function buildAnchor(el: Element, clientX: number, clientY: number): Anchor {
  const rect = el.getBoundingClientRect();
  const xPercent = rect.width ? clamp(((clientX - rect.left) / rect.width) * 100, 0, 100) : 50;
  const yPercent = rect.height ? clamp(((clientY - rect.top) / rect.height) * 100, 0, 100) : 50;
  return {
    type: "pin",
    selector: buildSelector(el),
    xPercent: Math.round(xPercent * 100) / 100,
    yPercent: Math.round(yPercent * 100) / 100,
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
