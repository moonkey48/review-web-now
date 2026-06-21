import { render } from "preact";
import { App } from "./app";
import { HOST_ID } from "./anchor";
import { parseReviewInvite } from "./reviewGate";
import { migrate } from "./store";

// ───────────────────────────────────────────────────────────
// Reviewer 위젯 부트스트랩 (로컬 전용 · 백엔드 없음)
//
// 노출 제어 — 두 가지 로드 경로:
//  1) 북마클릿 / 데모: window.__RV_FORCE__ = 1 로 게이트를 건너뛰고 항상 마운트.
//     북마클릿 재클릭 시 토글로 꺼진다.
//  2) <script src=".../widget.js"> 태그: 게이트가 걸린다.
//     현재 URL에 ?review 쿼리가 있을 때만 마운트한다.
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

// 노출 게이트.
//  - 북마클릿/데모(__RV_FORCE__): 바로 표시, 비번 없음
//  - ?review 진입: 바로 표시. review 값은 작성자 이름 초기값으로 쓴다.
//  - 그 외(일반 사용자): 아무것도 안 함
function shouldMount(): { mount: boolean; initialName: string } {
  if (window.__RV_FORCE__) {
    return { mount: true, initialName: "" };
  }

  const invite = parseReviewInvite(location.href);
  if (invite) return { mount: true, initialName: invite.name };

  return { mount: false, initialName: "" };
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

function mount(initialName: string) {
  installHistoryHook();
  migrate(); // 버전 없는 기존 코멘트를 "v0"로 일회성 스탬프(멱등·loadAll은 순수 읽기 유지)

  const host = document.createElement("div");
  host.id = HOST_ID;
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  const remove = () => {
    render(null, shadow);
    host.remove();
    delete window.__REVIEWER__;
  };

  render(
    <App
      onHide={remove}
      initialName={initialName}
    />,
    shadow,
  );
  window.__REVIEWER__ = { remove };
}

function start() {
  // 이미 떠 있으면(북마클릿 재클릭) 끄는 스위치로 동작
  if (window.__REVIEWER__) {
    window.__REVIEWER__.remove();
    return;
  }
  const { mount: should, initialName } = shouldMount(); // 게이트
  if (!should) return; // 초대받지 않은 사용자에겐 아무것도 안 함
  if (document.getElementById(HOST_ID)) return; // 방어적 중복 가드
  if (!document.body) return;
  mount(initialName);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => start(), { once: true });
} else {
  start();
}
