// opt-in 스크린샷 캡처 — html2canvas를 "캡처하는 순간에만" 지연 로드한다.
// 기본 번들에 넣으면 북마클릿 크기 한도를 넘기므로 절대 정적 import 하지 않는다.
// 기본은 CDN, window.__RV_H2C_URL__로 같은 origin 자가호스트 경로를 주입하면 네트워크 0 유지.
import { HOST_ID } from "./anchor";

const DEFAULT_URL =
  "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";

type H2C = (
  el: HTMLElement,
  opts?: Record<string, unknown>,
) => Promise<HTMLCanvasElement>;

declare global {
  interface Window {
    html2canvas?: H2C;
    __RV_H2C_URL__?: string;
  }
}

let loading: Promise<H2C> | null = null;
let captureQueue: Promise<void> = Promise.resolve();

function load(): Promise<H2C> {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (loading) return loading;
  loading = new Promise<H2C>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = window.__RV_H2C_URL__ || DEFAULT_URL;
    s.crossOrigin = "anonymous";
    s.onload = () =>
      window.html2canvas
        ? resolve(window.html2canvas)
        : reject(new Error("html2canvas not found after load"));
    s.onerror = () => {
      loading = null; // 다음 시도 때 다시 받도록
      reject(new Error("html2canvas load failed"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export interface Capture {
  blob: Blob;
  w: number;
  h: number;
}

// 핀 요소만 잘리면 주변 맥락이 없으므로, 적당히 큰 부모 블록을 캡처 대상으로 삼는다.
// 단 페이지 전체급으로 큰 컨테이너(긴 본문)는 피한다.
function contextRoot(el: Element): Element {
  const parent = el.parentElement;
  if (!parent || parent === document.body || parent === document.documentElement) {
    return el;
  }
  const pr = parent.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  if (pr.width === 0 || pr.height === 0) return el; // inline/0크기 부모
  if (pr.height > window.innerHeight * 1.5 || pr.width > window.innerWidth * 1.5) return el;
  // 부모가 el과 거의 같은 크기면 맥락 이득이 없으니 요소만.
  const pa = pr.width * pr.height;
  if (pa > 0 && (er.width * er.height) / pa > 0.9) return el;
  return parent;
}

// 캡처된 canvas 위에 핀 요소 위치를 강조 박스 + 번호 배지로 주석(순수 Canvas 2D, 의존성 0).
function annotate(
  canvas: HTMLCanvasElement,
  root: Element,
  el: Element,
  badge?: number,
) {
  const ctx = canvas.getContext("2d");
  const rr = root.getBoundingClientRect();
  if (!ctx || rr.width === 0 || rr.height === 0) return;
  const er = el.getBoundingClientRect();
  const sx = canvas.width / rr.width;
  const sy = canvas.height / rr.height;
  const lw = Math.max(2, 2 * sx);
  // 캔버스 경계 안으로 clamp — 요소가 root를 꽉 채우거나(좌표 0/가장자리) 음수일 때
  // 박스가 캔버스 밖에 그려져 안 보이는 것을 방지.
  const inset = lw + 1;
  const bx = Math.min(Math.max((er.left - rr.left) * sx, inset), canvas.width - inset);
  const by = Math.min(Math.max((er.top - rr.top) * sy, inset), canvas.height - inset);
  const bw = Math.max(0, Math.min(er.width * sx, canvas.width - inset - bx));
  const bh = Math.max(0, Math.min(er.height * sy, canvas.height - inset - by));
  // 흰 halo + 빨강 박스 — 임의 색상의 UI 위에서도 대비를 보장(동색 카무플라주 방지)
  ctx.lineWidth = lw + 2;
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.strokeRect(bx, by, bw, bh);
  ctx.lineWidth = lw;
  ctx.strokeStyle = "#ef4444";
  ctx.strokeRect(bx, by, bw, bh);
  if (badge != null) {
    const r = 13 * sx;
    const cx = Math.max(r + 2, bx + r); // 가장자리에서도 잘리지 않게
    const cy = Math.max(r + 2, by + r);
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${15 * sx}px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(badge), cx, cy);
  }
}

// 핀 요소 + 주변 맥락을 PNG로. 캡처 동안 위젯 host를 숨겨 UI가 찍히지 않게 한다.
async function captureElementNow(
  el: Element,
  opts?: { badge?: number },
): Promise<Capture | null> {
  const h2c = await load();
  const root = contextRoot(el);
  const host = document.getElementById(HOST_ID);
  const prev = host ? host.style.visibility : "";
  if (host) host.style.visibility = "hidden";
  let src: HTMLCanvasElement;
  try {
    src = await h2c(root as HTMLElement, {
      backgroundColor: "#ffffff",
      scale: Math.min(2, window.devicePixelRatio || 1),
      logging: false,
      useCORS: true,
    });
  } finally {
    if (host) host.style.visibility = prev;
  }
  // html2canvas가 반환한 캔버스에 직접 그리면 컨텍스트 변환 상태가 남아 export에 반영되지 않는다.
  // 새 캔버스로 복사한 뒤 핀 위치를 강조(박스+번호 배지)한다.
  const canvas = document.createElement("canvas");
  canvas.width = src.width;
  canvas.height = src.height;
  canvas.getContext("2d")?.drawImage(src, 0, 0);
  annotate(canvas, root, el, opts?.badge);
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob((b) => res(b), "image/png"),
  );
  if (!blob) return null;
  return { blob, w: canvas.width, h: canvas.height };
}

export function captureElement(
  el: Element,
  opts?: { badge?: number },
): Promise<Capture | null> {
  const run = () => captureElementNow(el, opts);
  const job = captureQueue.then(run, run);
  captureQueue = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}
