import { render } from "preact";
import { App } from "./app";
import { HOST_ID } from "./anchor";

// ───────────────────────────────────────────────────────────
// Reviewer 위젯 부트스트랩 (로컬 전용 · 백엔드 없음)
//
// 노출 제어 — 두 가지 로드 경로:
//  1) 북마클릿 / 데모: window.__RV_FORCE__ = 1 로 게이트를 건너뛰고 항상 마운트.
//     북마클릿 재클릭 시 토글로 꺼진다.
//  2) <script src=".../widget.js"> 태그: 게이트가 걸린다.
//     ?review 링크를 거친 브라우저(localStorage rv:enabled=1)에만 마운트.
//     일반 사용자는 렌더도 아무것도 하지 않는다.
//
// 모든 코멘트는 그 사이트 origin의 localStorage에만 저장된다. 네트워크 요청 0.
// ───────────────────────────────────────────────────────────

declare global {
  interface Window {
    __REVIEWER__?: { remove: () => void };
    __RV_FORCE__?: boolean;
    __rvHistoryHooked?: boolean;
  }
}

const KEY_ENABLED = "rv:enabled";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private 모드 등 — 무시 */
  }
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

// 스크립트 태그 경로의 노출 게이트.
function shouldMount(): boolean {
  if (window.__RV_FORCE__) return true; // 북마클릿/데모는 무조건 표시
  try {
    const url = new URL(location.href);
    if (url.searchParams.has("review")) {
      // 초대 링크 1회 방문 → 이 브라우저에서 계속 켜짐 + URL에서 흔적 제거
      safeSet(KEY_ENABLED, "1");
      url.searchParams.delete("review");
      history.replaceState(history.state, "", url.toString());
      return true;
    }
  } catch {
    /* URL 파싱 실패 무시 */
  }
  return safeGet(KEY_ENABLED) === "1";
}

// pushState/replaceState 훅 — SPA 경로 변경을 위젯에 알린다.
// 북마클릿이 여러 번 주입돼도 한 번만 감싸도록 window 플래그로 가드한다.
function installHistoryHook() {
  if (window.__rvHistoryHooked) return;
  window.__rvHistoryHooked = true;
  const fire = () => window.dispatchEvent(new Event("reviewer:nav"));
  const origPush = history.pushState;
  history.pushState = function (...args: Parameters<History["pushState"]>) {
    const ret = origPush.apply(this, args);
    fire();
    return ret;
  };
  const origReplace = history.replaceState;
  history.replaceState = function (
    ...args: Parameters<History["replaceState"]>
  ) {
    const ret = origReplace.apply(this, args);
    fire();
    return ret;
  };
}

function mount() {
  installHistoryHook();

  const host = document.createElement("div");
  host.id = HOST_ID;
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  const remove = () => {
    render(null, shadow);
    host.remove();
    delete window.__REVIEWER__;
    // 스크립트 태그 모드에서 "닫기" = 이 브라우저에서 끔(다시 ?review 링크로 켠다).
    // 북마클릿 모드에선 플래그가 없으니 이 호출은 무해하다.
    safeRemove(KEY_ENABLED);
  };

  render(<App onHide={remove} />, shadow);
  window.__REVIEWER__ = { remove };
}

function start() {
  // 이미 떠 있으면(북마클릿 재클릭) 끄는 스위치로 동작
  if (window.__REVIEWER__) {
    window.__REVIEWER__.remove();
    return;
  }
  if (!shouldMount()) return; // 게이트: 초대받지 않은 사용자에겐 아무것도 안 함
  if (document.getElementById(HOST_ID)) return; // 방어적 중복 가드
  if (!document.body) return;
  mount();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => start(), { once: true });
} else {
  start();
}
