// 클릭 요소의 컴포넌트명/소스 위치를 best-effort로 추출한다 (핸드오프 ① 소스 포인터).
// 우선순위:
//   ① 심어둔 data-* 속성(data-component / data-source / data-locatorjs-id / data-inspector-*)
//      — 유일하게 prod-safe·React 버전 무관. 타깃 앱이 빌드 플러그인으로 심어야 동작.
//   ② fiber._debugSource(React 16/17/18 dev) → file:line.  ※ React 19에서 제거됨(PR #28265).
//   ③ fiber.type 언래핑(forwardRef/memo) 컴포넌트 이름 — React 19 dev 포함. prod 난독화는 거른다.
// 절대 throw 하지 않는다. prod React 19 빌드에선 보통 undefined 반환(정상 — 인용/role 앵커가 핸드오프를 짊).
// 의존성 0, 순수 동기 DOM/property 읽기. buildSelector에는 절대 쓰지 않는다(휘발성/비셀렉터).
import type { SourceRef } from "./types";

function clean(r: SourceRef): SourceRef | undefined {
  const out: SourceRef = {};
  if (r.component) out.component = r.component;
  if (r.file) out.file = r.file;
  if (typeof r.line === "number" && r.line > 0) out.line = r.line;
  return out.component || out.file ? out : undefined;
}

// "a/b/Foo.tsx:42:7" / "a/b/Foo.tsx::42" / "a/b/Foo.tsx:42" → {file,line}
// 끝에서 :line[:col]만 떼어낸다(경로 앞쪽 ':' — 윈도우 드라이브 'C:' 등 — 은 보존).
function parseFileLine(raw: string): { file?: string; line?: number } | undefined {
  const s = raw.replace("::", ":").trim();
  const m = /^(.*?):(\d+)(?::\d+)?$/.exec(s);
  if (m && m[1]) return { file: m[1], line: Number(m[2]) };
  return /[/\\.]/.test(s) ? { file: s } : undefined;
}

// ① 심어둔 속성 — el과 가까운 조상(≤6)까지. 빌드 플러그인이 JSX 호스트에 태깅하므로 자식일 수 있음.
function fromAttributes(start: Element): SourceRef | undefined {
  let node: Element | null = start;
  for (let hops = 0; node && hops < 6; hops++, node = node.parentElement) {
    const comp = node.getAttribute("data-component") || undefined;
    // react-dev-inspector: 경로/라인 분리.
    const relPath = node.getAttribute("data-inspector-relative-path");
    if (relPath) {
      const ln = Number(node.getAttribute("data-inspector-line"));
      return clean({
        component: comp,
        file: relPath,
        line: Number.isFinite(ln) && ln > 0 ? ln : undefined,
      });
    }
    // "파일:라인[:컬럼]" 문자열 속성들.
    const raw =
      node.getAttribute("data-source") ||
      node.getAttribute("data-locatorjs-id") ||
      undefined;
    if (raw) {
      const parsed = parseFileLine(raw);
      if (parsed) return clean({ component: comp, ...parsed });
    }
    if (comp) return clean({ component: comp }); // 이름만 있어도 채택(사용자가 심은 값 — 그대로 신뢰)
  }
  return undefined;
}

// DOM 노드 → React fiber. 키는 __reactFiber$<hash>(17+) / __reactInternalInstance$<hash>(16).
// 해시 접미사는 페이지마다 랜덤 → prefix 매칭. 첫 글자 '_'(95)로 빠르게 거른다. own 키만 본다.
function getFiber(el: Element): any {
  const keys = Object.keys(el);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (
      k.charCodeAt(0) === 95 &&
      (k.indexOf("__reactFiber$") === 0 ||
        k.indexOf("__reactInternalInstance$") === 0)
    ) {
      return (el as any)[k];
    }
  }
  return null;
}

// ② _debugSource: React ≤18 dev에서만 존재(19 제거). 호스트→부모(return)로 가장 가까운 소스 탐색.
function fromDebugSource(fiber: any): { file?: string; line?: number } | undefined {
  let f = fiber;
  let hops = 0;
  while (f && hops++ < 30) {
    const src = f._debugSource; // {fileName, lineNumber, columnNumber}
    if (src && src.fileName) {
      return {
        file: String(src.fileName),
        line: typeof src.lineNumber === "number" ? src.lineNumber : undefined,
      };
    }
    f = f.return;
  }
  return undefined;
}

// 프레임워크/난독화 잡음 이름 거름: 대문자 시작 + 2글자↑ + 예약어 제외(prod 난독화 'a','Lh' 차단).
const JUNK = new Set([
  "ForwardRef", "Memo", "Anonymous", "Fragment", "Suspense", "Profiler",
  "StrictMode", "Provider", "Consumer", "Unknown", "Component", "Context", "Object",
]);
function goodName(n: string | undefined): string | undefined {
  if (!n) return undefined;
  const base = n.replace(/^(?:ForwardRef|Memo)\(([^)]+)\)$/, "$1").trim();
  if (base.length < 2 || JUNK.has(base) || !/^[A-Z][A-Za-z0-9_]+$/.test(base)) {
    return undefined;
  }
  return base;
}

// fiber.type 언래핑(forwardRef/memo만). DevTools getDisplayNameForFiber 축약판.
function typeName(type: any, depth = 0): string | undefined {
  if (!type || depth > 2) return undefined;
  if (typeof type === "string") return undefined; // 호스트 태그('div')는 컴포넌트가 아님
  if (typeof type === "function") return type.displayName || type.name || undefined;
  if (typeof type === "object") {
    if (type.displayName) return type.displayName;
    if (type.render) return typeName(type.render, depth + 1); // forwardRef
    if (type.type) return typeName(type.type, depth + 1); // memo
  }
  return undefined;
}

// 호스트 fiber에서 부모 체인(return)을 타고 가장 가까운 합성 컴포넌트 이름.
function fromFiberName(fiber: any): string | undefined {
  let f = fiber;
  let hops = 0;
  while (f && hops++ < 30) {
    const n = goodName(typeName(f.type));
    if (n) return n;
    f = f.return;
  }
  return undefined;
}

// 공개 API — 절대 throw 안 함. 신뢰할 값이 없으면 undefined.
export function reactSource(el: Element): SourceRef | undefined {
  try {
    const attrs = fromAttributes(el); // ① prod-safe 우선
    if (attrs && (attrs.file || attrs.component)) return attrs;
    const fiber = getFiber(el);
    if (!fiber) return attrs; // React 아님 → ①만(있으면)
    const src = fromDebugSource(fiber); // ② React≤18 dev → file:line
    const name = fromFiberName(fiber); // ③ 이름(19 dev 포함)
    return (
      clean({ component: name || attrs?.component, file: src?.file, line: src?.line }) ||
      attrs
    );
  } catch {
    return undefined; // React 내부 변동에도 위젯이 죽지 않게
  }
}
