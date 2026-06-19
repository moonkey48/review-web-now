// Shadow DOM 내부에 주입되는 전체 스타일. 페이지 CSS와 완전히 격리된다.
export const CSS_TEXT = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.rv-root {
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", Pretendard,
    "Noto Sans KR", "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: #18181b;
  -webkit-font-smoothing: antialiased;
}
button { cursor: pointer; background: none; border: none; font: inherit; color: inherit; }
button:disabled { cursor: not-allowed; opacity: .5; }
input, textarea { font: inherit; color: inherit; }

/* ── 플로팅 버튼 ─────────────────────────────── */
.rv-fab {
  position: fixed; right: 20px; bottom: 20px; z-index: 2147483600;
  width: 48px; height: 48px; border-radius: 50%;
  background: #18181b; color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,.28);
  transition: transform .15s ease;
}
.rv-fab:hover { transform: scale(1.07); }
.rv-fab svg { width: 22px; height: 22px; }
.rv-fab-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
  background: #ef4444; color: #fff; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

/* ── 코멘트 모드 오버레이 ────────────────────── */
.rv-overlay { position: fixed; inset: 0; z-index: 2147483550; cursor: crosshair; }
.rv-highlight {
  position: fixed; pointer-events: none; z-index: 2147483551;
  border: 2px dashed #6366f1; background: rgba(99,102,241,.08); border-radius: 4px;
}
.rv-mode-hint {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  z-index: 2147483552; pointer-events: none;
  background: #18181b; color: #fff; font-size: 12px;
  padding: 8px 14px; border-radius: 999px;
  box-shadow: 0 4px 16px rgba(0,0,0,.3); white-space: nowrap;
}

/* ── 코멘트 모드 상태바 (오버레이보다 위 — 종료 버튼 클릭 가능) ── */
.rv-modebar {
  position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%);
  z-index: 2147483630;
  display: flex; align-items: center; gap: 10px;
  background: #18181b; color: #fff; font-size: 12px; font-weight: 600;
  padding: 7px 7px 7px 14px; border-radius: 999px;
  box-shadow: 0 6px 20px rgba(0,0,0,.35); white-space: nowrap;
}
.rv-modebar-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #6366f1;
  animation: rv-pulse 1.4s infinite;
}
@keyframes rv-pulse {
  0% { box-shadow: 0 0 0 0 rgba(99,102,241,.6); }
  70% { box-shadow: 0 0 0 7px rgba(99,102,241,0); }
  100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
}
.rv-modebar-exit {
  background: #fff; color: #18181b; border-radius: 999px;
  padding: 4px 12px; font-size: 12px; font-weight: 700;
}
.rv-modebar-exit:hover { background: #e4e4e7; }

/* ── 입장(잠금) 화면 ───────────────────────── */
.rv-lock-backdrop {
  position: fixed; inset: 0; z-index: 2147483646;
  background: rgba(0,0,0,.4);
  display: flex; align-items: center; justify-content: center;
}
.rv-lock {
  width: 300px; padding: 18px; display: flex; flex-direction: column; gap: 10px;
  background: #fff; border: 1px solid #e4e4e7; border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0,0,0,.28);
}
.rv-lock-title { font-weight: 700; font-size: 16px; }
.rv-lock-desc { font-size: 12px; color: #71717a; margin: -4px 0 2px; }
.rv-lock-err { font-size: 12px; color: #dc2626; }
.rv-lock .rv-row-end { margin-top: 4px; }

/* ── 코멘트 모드 시작 바 (중앙 하단) ── */
.rv-startbar {
  position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%);
  z-index: 2147483628;
  background: #6366f1; color: #fff; font-size: 13px; font-weight: 700;
  padding: 10px 18px; border-radius: 999px;
  box-shadow: 0 6px 20px rgba(79,70,229,.4);
  transition: transform .12s ease;
}
.rv-startbar:hover { background: #4f46e5; transform: translateX(-50%) translateY(-2px); }

/* ── 작성 중 대상 요소 강조 박스 ── */
.rv-draft-box {
  position: fixed; pointer-events: none; z-index: 2147483551;
  border: 2px solid #6366f1; background: rgba(99,102,241,.12);
  border-radius: 4px; box-shadow: 0 0 0 2px rgba(99,102,241,.25);
}

/* ── 등록 버튼 단축키 키캡 ── */
.rv-kbd {
  display: inline-block; font-size: 11px; line-height: 1;
  background: rgba(255,255,255,.22); border-radius: 4px;
  padding: 2px 5px; margin-left: 5px; font-weight: 700;
}

/* ── 패널 부제(전체 서비스 표시) ── */
.rv-panel-sub {
  padding: 8px 12px 0; font-size: 12px; color: #71717a; font-weight: 600;
}

/* ── 버전 바 (ZONE1 항상 보임: 스위치+생성+표시토글 / ZONE2 접이식: 표시할 버전) ── */
.rv-verbar { border-bottom: 1px solid #f1f1f4; }
/* ZONE 1 — 항상 보이는 한 줄 */
.rv-ver-bar1 { display: flex; align-items: center; gap: 6px; padding: 8px 12px; }
/* 현재 작성 버전 스위치(네이티브 select) — 긴 라벨은 max-width로 클립(가로 오버플로 방지) */
.rv-ver-select {
  flex: 0 1 auto; min-width: 0; max-width: 150px;
  border: 1px solid #d4d4d8; border-radius: 8px; padding: 5px 8px;
  font-size: 12px; font-weight: 700; color: #18181b; background: #fff;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rv-ver-select:focus { border-color: #6366f1; outline: none; }
.rv-ver-newbtn { flex-shrink: 0; padding: 5px 9px; font-size: 12px; white-space: nowrap; }
.rv-ver-vistog {
  flex-shrink: 0; margin-left: auto;
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 11px; font-weight: 600; color: #71717a;
  padding: 4px 6px; border-radius: 6px; font-variant-numeric: tabular-nums;
}
.rv-ver-vistog:hover { background: #f4f4f5; color: #18181b; }
.rv-ver-vistog b { color: #18181b; }
.rv-ver-caret { flex-shrink: 0; color: #a1a1aa; font-size: 10px; transition: transform .15s ease; }
.rv-verbar.rv-open .rv-ver-caret { transform: rotate(180deg); }
/* ZONE 2 — 펼친 본문(가시성 목록만) */
.rv-ver-body { padding: 0 12px 10px; }
.rv-ver-toolbar { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.rv-ver-hint { font-size: 11px; color: #71717a; font-weight: 600; margin-right: auto; }
.rv-ver-mini {
  font-size: 11px; color: #52525b; font-weight: 600;
  border: 1px solid #e4e4e7; background: #fafafa; border-radius: 6px; padding: 3px 8px;
}
.rv-ver-mini:hover { background: #f4f4f5; border-color: #d4d4d8; }
/* 목록이 길어져도 패널이 늘어나지 않게 고정 높이 + 스크롤 */
.rv-verlist {
  margin-top: 6px; max-height: 168px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 1px;
}
/* 행 = 표시 멀티선택 <label> + 체크박스 (여러 버전 동시 보기) */
.rv-ver-row {
  width: 100%; display: flex; align-items: center; gap: 8px; text-align: left;
  padding: 5px 6px; border-radius: 6px; font-size: 12px; cursor: pointer;
}
.rv-ver-row:hover { background: #f4f4f5; }
.rv-ver-row.rv-ver-off { opacity: .5; }
.rv-ver-cb { width: 14px; height: 14px; flex-shrink: 0; accent-color: #6366f1; cursor: pointer; }
.rv-ver-swatch { width: 13px; height: 13px; border-radius: 4px; background: var(--rv-c, #6366f1); flex-shrink: 0; }
/* 숨김: 채움 대신 색 링 — 어느 버전인지는 유지하면서 off임을 표현 */
.rv-ver-off .rv-ver-swatch { background: transparent; box-shadow: inset 0 0 0 2px var(--rv-c, #a1a1aa); }
/* 긴 버전명은 말줄임(…) */
.rv-ver-name {
  min-width: 0; flex-shrink: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: #3f3f46; font-weight: 600;
}
/* 카운트는 이름 바로 뒤 작은 칩 — 멀리 떨어진 우측정렬 폐기(이름↔수가 한 단위) */
.rv-ver-count {
  flex-shrink: 0; font-size: 10px; color: #71717a; font-variant-numeric: tabular-nums;
  background: #f4f4f5; border-radius: 999px; padding: 1px 6px;
}
.rv-ver-off .rv-ver-count { background: transparent; }
.rv-ver-now {
  flex-shrink: 0; margin-left: auto; font-size: 9px; font-weight: 700; color: #4338ca;
  background: #e0e7ff; border-radius: 4px; padding: 1px 4px;
}

/* ── 핀 ──────────────────────────────────────── */
.rv-pin {
  position: fixed; z-index: 2147483560;
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--rv-c, #6366f1); color: #fff; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.35);
  transform: translate(-50%, -100%);
  transition: transform .1s ease;
}
.rv-pin:hover { transform: translate(-50%, -100%) scale(1.12); }
.rv-pin.rv-pin-resolved { background: #a1a1aa; opacity: .55; }
.rv-pin.rv-pin-active { outline: 3px solid rgba(99,102,241,.35); }

/* ── 카드 공통 (작성 폼 / 스레드 / 패널) ────── */
.rv-card {
  position: fixed; z-index: 2147483620;
  background: #fff; border: 1px solid #e4e4e7; border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0,0,0,.2);
}
.rv-card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-bottom: 1px solid #f1f1f4;
}
.rv-card-title { font-weight: 600; font-size: 13px; }
.rv-icon-btn { color: #a1a1aa; padding: 2px 4px; border-radius: 6px; font-size: 12px; }
.rv-icon-btn:hover { color: #18181b; background: #f4f4f5; }

.rv-input, .rv-textarea {
  width: 100%; border: 1px solid #d4d4d8; border-radius: 8px;
  padding: 7px 9px; font-size: 13px; outline: none; background: #fff;
}
.rv-input:focus, .rv-textarea:focus { border-color: #6366f1; }
.rv-textarea { resize: vertical; min-height: 64px; }

.rv-btn {
  border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600;
}
.rv-btn-primary { background: #18181b; color: #fff; }
.rv-btn-primary:hover { background: #3f3f46; }
.rv-btn-ghost { color: #52525b; border: 1px solid #d4d4d8; background: #fff; }
.rv-btn-ghost:hover { border-color: #a1a1aa; }
.rv-btn-danger { color: #dc2626; }
.rv-row { display: flex; gap: 6px; align-items: center; }
.rv-row-end { display: flex; gap: 6px; justify-content: flex-end; }

/* ── 작성 폼 ─────────────────────────────────── */
.rv-composer { width: 290px; padding: 12px; }
.rv-composer .rv-textarea { margin-top: 8px; }
.rv-composer .rv-row-end { margin-top: 8px; }
.rv-shot-check {
  display: flex; align-items: center; gap: 6px; margin-top: 8px;
  font-size: 12px; color: #52525b; cursor: pointer; user-select: none;
}
.rv-shot-check input { width: 14px; height: 14px; cursor: pointer; accent-color: #6366f1; }
.rv-shot-hint { margin-top: 4px; font-size: 11px; color: #b45309; line-height: 1.4; }

/* ── 스크린샷 썸네일 (스레드 팝업) ── */
.rv-shot-thumb {
  display: block; margin-top: 8px; max-width: 100%;
  border: 1px solid #e4e4e7; border-radius: 8px; background: #fff;
}

/* ── 스레드 팝업 ────────────────────────────── */
.rv-thread { width: 320px; max-height: min(480px, 72vh); display: flex; flex-direction: column; }
.rv-thread-body { overflow-y: auto; padding: 12px; }
.rv-msg { margin-bottom: 10px; }
.rv-msg-meta { font-size: 11px; color: #71717a; margin-bottom: 2px; display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap; }
.rv-msg-author { font-weight: 600; color: #3f3f46; }
.rv-msg-text { white-space: pre-wrap; word-break: break-word; }
.rv-msg-actions { display: inline-flex; gap: 6px; margin-left: 2px; }
.rv-msg-actions button { font-size: 11px; color: #a1a1aa; }
.rv-msg-actions button:hover { color: #18181b; }
.rv-resolve-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: #52525b;
  border: 1px solid #d4d4d8; border-radius: 999px; padding: 3px 9px; background: #fff;
}
.rv-resolve-btn.rv-on { color: #047857; border-color: #6ee7b7; background: #ecfdf5; }
.rv-del-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: #dc2626;
  border: 1px solid #fecaca; border-radius: 999px; padding: 3px 9px; background: #fef2f2;
}
.rv-del-btn:hover { background: #fee2e2; border-color: #fca5a5; }

/* ── 패널 ────────────────────────────────────── */
.rv-panel {
  right: 20px; bottom: 80px; width: 340px;
  max-height: min(560px, 75vh); display: flex; flex-direction: column;
}
.rv-tabs { display: flex; gap: 2px; padding: 8px 10px 0; }
.rv-tab {
  flex: 1; text-align: center; padding: 6px 0; font-size: 12px; font-weight: 600;
  color: #71717a; border-bottom: 2px solid transparent;
}
.rv-tab.rv-active { color: #18181b; border-color: #18181b; }
.rv-panel-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 6px; padding: 8px 12px;
}
.rv-check { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #71717a; cursor: pointer; }
.rv-list { overflow-y: auto; padding: 0 8px 8px; flex: 1; }
.rv-item {
  width: 100%; text-align: left; display: flex; gap: 8px; align-items: flex-start;
  padding: 8px; border-radius: 8px;
}
.rv-item:hover { background: #f4f4f5; }
.rv-item-num {
  flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%;
  background: var(--rv-c, #6366f1); color: #fff; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; margin-top: 1px;
}
.rv-item.rv-resolved .rv-item-num { background: #a1a1aa; }
.rv-item.rv-resolved .rv-item-text { color: #a1a1aa; text-decoration: line-through; }
.rv-item-text {
  font-size: 12px; color: #3f3f46;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  word-break: break-word;
}
.rv-item-meta { font-size: 10px; color: #a1a1aa; margin-top: 2px; }
.rv-badge {
  display: inline-block; font-size: 9px; font-weight: 700; border-radius: 4px;
  padding: 1px 4px; margin-left: 4px; vertical-align: 1px;
}
.rv-badge-lost { background: #fef3c7; color: #b45309; }
.rv-badge-page { background: #e0e7ff; color: #4338ca; }
.rv-empty { text-align: center; color: #a1a1aa; font-size: 12px; padding: 24px 12px; }
.rv-panel-foot {
  border-top: 1px solid #f1f1f4; padding: 8px 12px;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
/* 하단 액션 버튼들 — 잘 보이게 칩 형태로 */
.rv-foot-link {
  font-size: 12px; color: #3f3f46; font-weight: 600;
  padding: 6px 11px; border-radius: 8px;
  border: 1px solid #e4e4e7; background: #fafafa;
}
.rv-foot-link:hover { color: #18181b; background: #f4f4f5; border-color: #d4d4d8; }
.rv-foot-link.rv-danger { color: #dc2626; border-color: #fecaca; background: #fef2f2; }
.rv-foot-link.rv-danger:hover { color: #b91c1c; background: #fee2e2; border-color: #fca5a5; }
.rv-panel-foot { gap: 6px; flex-wrap: wrap; }
.rv-export .rv-btn { padding: 9px 14px; font-size: 13px; }

/* ── MD 내보내기 ────────────────────────────── */
.rv-export { padding: 8px 12px; border-top: 1px solid #f1f1f4; }
.rv-export-row { display: flex; gap: 6px; align-items: center; }
.rv-export-hint { font-size: 11px; color: #a1a1aa; margin-left: auto; white-space: nowrap; }

/* ── 내보내기 모달 (.rv-lock-backdrop 위) ── */
.rv-exmodal {
  width: min(440px, calc(100vw - 32px));
  max-height: min(80vh, 640px);
  display: flex; flex-direction: column;
  border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,.28);
}
.rv-exmodal .rv-card-head { padding: 13px 16px; }
.rv-exmodal-body { padding: 14px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.rv-ex-label { font-size: 11px; font-weight: 700; color: #71717a; margin-bottom: 6px; }
/* 방식 세그먼티드 */
.rv-ex-methods { display: flex; gap: 6px; }
.rv-ex-method {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 9px 4px; border: 1px solid #e4e4e7; border-radius: 10px; background: #fafafa;
  font-size: 11px; font-weight: 600; color: #52525b;
  transition: border-color .12s ease, background .12s ease;
}
.rv-ex-method:hover { border-color: #d4d4d8; background: #f4f4f5; }
.rv-ex-method:focus-visible { outline: 2px solid rgba(99,102,241,.55); outline-offset: 1px; }
.rv-ex-method.rv-on { border-color: #6366f1; background: #eef2ff; color: #18181b; box-shadow: inset 0 0 0 1px #6366f1; }
.rv-ex-method-ico { font-size: 16px; line-height: 1; }
/* 버전 칩 체크박스 */
.rv-ex-vers { display: flex; flex-wrap: wrap; gap: 6px; }
.rv-ex-ver {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  padding: 4px 10px 4px 7px; border: 1px solid #e4e4e7; border-radius: 999px; background: #fff;
  font-size: 12px; font-weight: 600; color: #3f3f46; max-width: 100%;
}
.rv-ex-ver:hover { background: #f4f4f5; }
.rv-ex-ver.rv-off { opacity: .45; }
.rv-ex-ver .rv-ver-swatch { width: 11px; height: 11px; }
.rv-ex-ver-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rv-ex-ver-count { flex-shrink: 0; font-size: 10px; color: #a1a1aa; font-variant-numeric: tabular-nums; }
/* 경고 (기존 경고색 #fef3c7/#b45309 재사용) */
.rv-ex-warn {
  display: flex; gap: 8px; align-items: flex-start;
  padding: 9px 11px; border-radius: 10px; font-size: 11px; line-height: 1.55;
  background: #fef3c7; border: 1px solid #fde68a; color: #92400e;
}
.rv-ex-warn b { color: #78350f; }
.rv-ex-warn-fix { color: #4338ca; font-weight: 700; text-decoration: underline; white-space: nowrap; }
.rv-ex-warn-fix:hover { color: #3730a3; }
/* 미리보기 */
.rv-ex-preview { border: 1px solid #f1f1f4; border-radius: 10px; overflow: hidden; }
.rv-ex-preview-list { max-height: 200px; overflow-y: auto; }
.rv-ex-prow { display: flex; gap: 8px; align-items: flex-start; padding: 8px 11px; }
.rv-ex-prow + .rv-ex-prow { border-top: 1px solid #f4f4f5; }
.rv-ex-pnum {
  flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%;
  background: var(--rv-c, #6366f1); color: #fff; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; margin-top: 1px;
}
.rv-ex-pbody { min-width: 0; flex: 1; display: block; }
.rv-ex-ptext {
  font-size: 12px; color: #3f3f46; display: -webkit-box; word-break: break-word;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.rv-ex-pmeta { display: block; font-size: 10px; color: #a1a1aa; margin-top: 2px; }
.rv-ex-empty { padding: 22px 12px; text-align: center; color: #a1a1aa; font-size: 12px; }
/* 하단 액션 */
.rv-exmodal-foot {
  padding: 12px 16px; border-top: 1px solid #f1f1f4;
  display: flex; gap: 8px; justify-content: flex-end; align-items: center;
}
.rv-ex-go { min-width: 120px; justify-content: center; text-align: center; }
.rv-mode-btn {
  width: calc(100% - 24px); margin: 10px 12px 2px;
  background: #6366f1; color: #fff; border-radius: 8px;
  padding: 8px 0; font-size: 12px; font-weight: 700; text-align: center;
}
.rv-mode-btn:hover { background: #4f46e5; }
.rv-mode-btn.rv-exit { background: #fff; color: #6366f1; border: 1px solid #6366f1; }

/* ── 토스트 ─────────────────────────────────── */
.rv-toast {
  position: fixed; bottom: 84px; left: 50%; transform: translateX(-50%);
  z-index: 2147483640; background: #18181b; color: #fff;
  font-size: 12px; padding: 8px 14px; border-radius: 999px;
  box-shadow: 0 4px 16px rgba(0,0,0,.3); white-space: nowrap;
}

/* ── 이름 설정 폼 ───────────────────────────── */
.rv-name-form { display: flex; gap: 6px; padding: 8px 12px; border-top: 1px solid #f1f1f4; }
`;
